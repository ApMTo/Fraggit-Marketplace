import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttributeType, LotStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AttributeDefinitionsService } from '../attribute-definitions/attribute-definitions.service';
import { FilesService } from '../files/files.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import {
  LOT_DETAIL_SELECT,
  LOT_LIST_SELECT,
  LotDetail,
  LotListItem,
  formatLotListItem,
} from './constants/lot.select';
import { CreateLotDto } from './dto/create-lot.dto';
import { FindLotsQueryDto } from './dto/find-lots.query.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import {
  buildLotListOrderBy,
  buildLotListWhere,
  normalizeFilterValue,
  ResolvedAttributeFilter,
} from './utils/build-lot-list-query';
import { normalizeLotAttributes } from './utils/normalize-lot-attributes';

export type LotListResult = {
  items: LotListItem[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subcategoriesService: SubcategoriesService,
    private readonly attributeDefinitionsService: AttributeDefinitionsService,
    private readonly filesService: FilesService,
  ) {}

  async createLot(
    sellerId: string,
    dto: CreateLotDto,
    photos: Express.Multer.File[] = [],
  ): Promise<LotDetail> {
    await this.subcategoriesService.assertBelongsToCategory(
      dto.subcategoryId,
      dto.categoryId,
    );

    const definitions =
      await this.attributeDefinitionsService.findApplicableForSubcategory(
        dto.subcategoryId,
      );

    const attributeValues = normalizeLotAttributes(dto.attributes, definitions);

    const uploadedPhotos =
      photos.length > 0
        ? await this.filesService.uploadMultiple(photos, 'lots')
        : [];

    return this.prisma.$transaction(async (tx) => {
      return tx.lot.create({
        data: {
          title: dto.title,
          description: dto.description ?? null,
          price: dto.price,
          stock: dto.stock ?? 1,
          sellerId,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          attributes: {
            create: attributeValues,
          },
          images: {
            create: uploadedPhotos.map((photo, index) => ({
              url: photo.url,
              sortOrder: index,
            })),
          },
        },
        select: LOT_DETAIL_SELECT,
      });
    });
  }

  async findById(id: string): Promise<LotDetail> {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      select: LOT_DETAIL_SELECT,
    });

    if (!lot) {
      throw new NotFoundException('lot_not_found');
    }

    return lot;
  }

  async findLots(
    categorySlug: string,
    subcategorySlug: string,
    query: FindLotsQueryDto,
  ): Promise<LotListResult> {
    const { subcategoryId } = await this.subcategoriesService.resolveBySlugs(
      categorySlug,
      subcategorySlug,
    );

    const attributeFilters = await this.resolveAttributeFilters(
      subcategoryId,
      query.filters,
    );

    const where = buildLotListWhere(
      subcategoryId,
      query.search,
      attributeFilters,
    );
    const orderBy = buildLotListOrderBy(query.sort);
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      this.prisma.lot.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: LOT_LIST_SELECT,
      }),
      this.prisma.lot.count({ where }),
    ]);

    return {
      items: rows.map(formatLotListItem),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateLot(
    sellerId: string,
    id: string,
    dto: UpdateLotDto,
    photos: Express.Multer.File[] = [],
  ): Promise<LotDetail> {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      select: {
        sellerId: true,
        status: true,
        subcategoryId: true,
        images: { select: { id: true } },
      },
    });

    if (!lot) {
      throw new NotFoundException('lot_not_found');
    }

    if (lot.sellerId !== sellerId) {
      throw new ForbiddenException('lot_forbidden');
    }

    if (lot.status !== LotStatus.OPEN) {
      throw new ConflictException('lot_not_editable');
    }

    this.assertValidKeepImageIds(dto.keepImageIds, lot.images);

    const totalImages = dto.keepImageIds.length + photos.length;
    if (totalImages > 5) {
      throw new BadRequestException('lot_images_max_count');
    }

    const definitions =
      await this.attributeDefinitionsService.findApplicableForSubcategory(
        lot.subcategoryId,
      );

    const attributeValues = normalizeLotAttributes(dto.attributes, definitions);

    const uploadedPhotos =
      photos.length > 0
        ? await this.filesService.uploadMultiple(photos, 'lots')
        : [];

    return this.prisma.$transaction(async (tx) => {
      await tx.lotImage.deleteMany({
        where: {
          lotId: id,
          id: { notIn: dto.keepImageIds },
        },
      });

      for (let index = 0; index < dto.keepImageIds.length; index++) {
        await tx.lotImage.update({
          where: { id: dto.keepImageIds[index] },
          data: { sortOrder: index },
        });
      }

      if (uploadedPhotos.length > 0) {
        await tx.lotImage.createMany({
          data: uploadedPhotos.map((photo, index) => ({
            lotId: id,
            url: photo.url,
            sortOrder: dto.keepImageIds.length + index,
          })),
        });
      }

      await tx.lotAttributeValue.deleteMany({ where: { lotId: id } });

      return tx.lot.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description ?? null,
          price: dto.price,
          stock: dto.stock ?? 1,
          attributes: {
            create: attributeValues,
          },
        },
        select: LOT_DETAIL_SELECT,
      });
    });
  }

  private assertValidKeepImageIds(
    keepImageIds: string[],
    existingImages: { id: string }[],
  ): void {
    const existingIds = new Set(existingImages.map((image) => image.id));
    const seenIds = new Set<string>();

    for (const imageId of keepImageIds) {
      if (seenIds.has(imageId)) {
        throw new BadRequestException('duplicate_image_id');
      }
      seenIds.add(imageId);

      if (!existingIds.has(imageId)) {
        throw new BadRequestException('unknown_image_id');
      }
    }
  }

  private async resolveAttributeFilters(
    subcategoryId: string,
    filters: Record<string, string | number | boolean>,
  ): Promise<ResolvedAttributeFilter[]> {
    const entries = Object.entries(filters);
    if (!entries.length) {
      return [];
    }

    const definitions =
      await this.attributeDefinitionsService.findApplicableForSubcategory(
        subcategoryId,
      );
    const definitionByKey = new Map(
      definitions.map((definition) => [definition.key, definition]),
    );

    const resolved: ResolvedAttributeFilter[] = [];

    for (const [key, rawValue] of entries) {
      const definition = definitionByKey.get(key);
      if (!definition) {
        throw new BadRequestException(`unknown_filter_key:${key}`);
      }

      if (
        typeof rawValue !== 'string' &&
        typeof rawValue !== 'number' &&
        typeof rawValue !== 'boolean'
      ) {
        throw new BadRequestException(`invalid_filter_value:${key}`);
      }

      try {
        const value = normalizeFilterValue(definition, rawValue);
        resolved.push({
          attributeId: definition.id,
          value,
          multiselect: definition.type === AttributeType.MULTISELECT,
        });
      } catch {
        throw new BadRequestException(`invalid_filter_value:${key}`);
      }
    }

    return resolved;
  }
}
