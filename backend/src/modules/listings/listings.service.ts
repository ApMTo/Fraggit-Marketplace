import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AttributeDefinitionsService } from '../attribute-definitions/attribute-definitions.service';
import { FilesService } from '../files/files.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { LOT_DETAIL_SELECT, LotDetail } from './constants/lot.select';
import { CreateLotDto } from './dto/create-lot.dto';
import { normalizeLotAttributes } from './utils/normalize-lot-attributes';

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
}
