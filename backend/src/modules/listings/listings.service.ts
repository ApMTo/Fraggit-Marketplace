import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttributeType, LotStatus, LotType, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { assertStaffCannotTrade } from '../moderation/policies/moderation-policy';
import { AttributeDefinitionsService } from '../attribute-definitions/attribute-definitions.service';
import { FilesService } from '../files/files.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  LOT_DETAIL_SELECT,
  LOT_LIST_SELECT,
  LotDetail,
  LotListItem,
  formatLotListItem,
} from './constants/lot.select';
import { CreateLotDto } from './dto/create-lot.dto';
import { FindLotsQueryDto } from './dto/find-lots.query.dto';
import { FindSellerLotsQueryDto } from './dto/find-seller-lots.query.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import {
  buildLotListOrderBy,
  buildLotListWhere,
  buildSellerLotListWhere,
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
    private readonly telegramService: TelegramService,
  ) {}

  async createLot(
    sellerId: string,
    sellerRole: UserRole,
    dto: CreateLotDto,
    photos: Express.Multer.File[] = [],
    preview?: Express.Multer.File,
  ): Promise<LotDetail> {
    assertStaffCannotTrade(sellerRole);

    await this.subcategoriesService.assertBelongsToCategory(
      dto.subcategoryId,
      dto.categoryId,
    );

    const definitions =
      await this.attributeDefinitionsService.findFilterableForSubcategory(
        dto.subcategoryId,
      );

    const attributeValues = normalizeLotAttributes(dto.attributes, definitions);

    const [uploadedPhotos, uploadedPreview, category] = await Promise.all([
      photos.length > 0
        ? this.filesService.uploadMultiple(photos, 'lots')
        : Promise.resolve([]),
      preview
        ? this.filesService.uploadFile(preview, 'lots/previews')
        : Promise.resolve(null),
      this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { previewUrl: true },
      }),
    ]);

    if (!category) {
      throw new NotFoundException('category_not_found');
    }

    const previewUrl = uploadedPreview?.path ?? category.previewUrl ?? null;
    const serviceQuestion =
      dto.type === LotType.SERVICE
        ? (dto.serviceQuestion?.trim() ?? null)
        : null;

    if (dto.type === LotType.SERVICE && !serviceQuestion) {
      throw new BadRequestException('service_question_required');
    }

    const lot = await this.prisma.$transaction(async (tx) => {
      return tx.lot.create({
        data: {
          title: dto.title,
          description: dto.description ?? null,
          previewUrl,
          type: dto.type,
          serviceQuestion,
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
              url: photo.path,
              sortOrder: index,
            })),
          },
        },
        select: LOT_DETAIL_SELECT,
      });
    });

    void this.telegramService.notifyLotCreated({
      sellerId,
      lotId: lot.id,
      title: lot.title,
      categorySlug: lot.category.slug,
      subcategorySlug: lot.subcategory.slug,
    });

    return lot;
  }

  async findById(id: string): Promise<LotDetail> {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      select: LOT_DETAIL_SELECT,
    });

    if (
      !lot ||
      lot.status === LotStatus.REMOVED ||
      lot.status === LotStatus.UNDER_REVIEW
    ) {
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

  async findLotsBySeller(
    query: FindSellerLotsQueryDto,
  ): Promise<LotListResult> {
    if (!query.sellerId && !query.sellerUsername) {
      throw new BadRequestException('seller_id_required');
    }

    let sellerId = query.sellerId;

    if (!sellerId && query.sellerUsername) {
      const seller = await this.prisma.user.findUnique({
        where: { username: query.sellerUsername },
        select: { id: true },
      });

      if (!seller) {
        throw new NotFoundException('user_not_found');
      }

      sellerId = seller.id;
    }

    const where = buildSellerLotListWhere(sellerId!, query.search);
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
    sellerRole: UserRole,
    id: string,
    dto: UpdateLotDto,
    photos: Express.Multer.File[] = [],
    preview?: Express.Multer.File,
  ): Promise<LotDetail> {
    assertStaffCannotTrade(sellerRole);

    const lot = await this.prisma.lot.findUnique({
      where: { id },
      select: {
        sellerId: true,
        status: true,
        type: true,
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

    let serviceQuestionUpdate: string | null | undefined = undefined;
    if (lot.type === LotType.SERVICE) {
      const trimmed = dto.serviceQuestion?.trim() ?? '';
      if (!trimmed) {
        throw new BadRequestException('service_question_required');
      }
      serviceQuestionUpdate = trimmed;
    }

    const definitions =
      await this.attributeDefinitionsService.findFilterableForSubcategory(
        lot.subcategoryId,
      );

    const attributeValues = normalizeLotAttributes(dto.attributes, definitions);

    const [uploadedPhotos, uploadedPreview] = await Promise.all([
      photos.length > 0
        ? this.filesService.uploadMultiple(photos, 'lots')
        : Promise.resolve([]),
      preview
        ? this.filesService.uploadFile(preview, 'lots/previews')
        : Promise.resolve(null),
    ]);

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
            url: photo.path,
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
          ...(serviceQuestionUpdate !== undefined
            ? { serviceQuestion: serviceQuestionUpdate }
            : {}),
          ...(uploadedPreview ? { previewUrl: uploadedPreview.path } : {}),
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
      await this.attributeDefinitionsService.findFilterableForSubcategory(
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
