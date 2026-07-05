import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import {
  CATEGORY_ADMIN_SELECT,
  CATEGORY_PUBLIC_SELECT,
  CategoryAdmin,
  CategoryPublic,
} from './constants/category.select';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CategoryPublic[]> {
    return this.prisma.category.findMany({
      select: CATEGORY_PUBLIC_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<CategoryAdmin> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: CATEGORY_ADMIN_SELECT,
    });

    if (!category) {
      throw new NotFoundException('category_not_found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryAdmin> {
    const slug = await this.resolveUniqueSlug(dto.slug ?? slugify(dto.name));

    try {
      return await this.prisma.category.create({
        data: { name: dto.name, slug },
        select: CATEGORY_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'category_slug_already_exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryAdmin> {
    await this.assertExists(id);

    const data: Prisma.CategoryUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.slug !== undefined) {
      data.slug = await this.resolveUniqueSlug(dto.slug, id);
    }

    if (!Object.keys(data).length) {
      return this.findById(id);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
        select: CATEGORY_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error, 'category_slug_already_exists');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('category_not_found');
        }
        if (error.code === 'P2003') {
          throw new ConflictException('category_has_lots');
        }
      }
      throw error;
    }
  }

  private async assertExists(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('category_not_found');
    }
  }

  private async resolveUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    if (!baseSlug) {
      throw new ConflictException('invalid_slug');
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: {
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
    } else {
      throw new BadRequestException('invalid_slug');
    }
  }
}
