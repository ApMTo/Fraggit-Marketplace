import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import {
  SUBCATEGORY_ADMIN_SELECT,
  SUBCATEGORY_PUBLIC_SELECT,
  SubcategoryAdmin,
  SubcategoryPublic,
} from './constants/subcategory.select';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findByCategoryId(categoryId: string): Promise<SubcategoryPublic[]> {
    return this.prisma.subcategory.findMany({
      where: { categoryId },
      select: SUBCATEGORY_PUBLIC_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<SubcategoryAdmin> {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      select: SUBCATEGORY_ADMIN_SELECT,
    });

    if (!subcategory) {
      throw new NotFoundException('subcategory_not_found');
    }

    return subcategory;
  }

  async create(
    categoryId: string,
    dto: CreateSubcategoryDto,
  ): Promise<SubcategoryAdmin> {
    await this.assertCategoryExists(categoryId);

    const slug = await this.resolveUniqueSlug(
      categoryId,
      dto.slug ?? slugify(dto.name),
    );

    try {
      return await this.prisma.subcategory.create({
        data: {
          categoryId,
          name: dto.name,
          slug,
        },
        select: SUBCATEGORY_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'subcategory_slug_already_exists');
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateSubcategoryDto,
  ): Promise<SubcategoryAdmin> {
    const existing = await this.prisma.subcategory.findUnique({
      where: { id },
      select: { id: true, categoryId: true },
    });

    if (!existing) {
      throw new NotFoundException('subcategory_not_found');
    }

    const data: Prisma.SubcategoryUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.slug !== undefined) {
      data.slug = await this.resolveUniqueSlug(
        existing.categoryId,
        dto.slug,
        id,
      );
    }

    if (!Object.keys(data).length) {
      return this.findById(id);
    }

    try {
      return await this.prisma.subcategory.update({
        where: { id },
        data,
        select: SUBCATEGORY_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'subcategory_slug_already_exists');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.subcategory.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('subcategory_not_found');
        }
        if (error.code === 'P2003') {
          throw new ConflictException('subcategory_has_lots');
        }
      }
      throw error;
    }
  }

  async assertBelongsToCategory(
    subcategoryId: string,
    categoryId: string,
  ): Promise<void> {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id: subcategoryId, categoryId },
      select: { id: true },
    });

    if (!subcategory) {
      throw new NotFoundException('subcategory_not_found');
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('category_not_found');
    }
  }

  private async resolveUniqueSlug(
    categoryId: string,
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    if (!baseSlug) {
      throw new ConflictException('invalid_slug');
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.subcategory.findFirst({
        where: {
          categoryId,
          slug: candidate,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private rethrowUniqueConflict(error: unknown, code: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(code);
    }
  }
}
