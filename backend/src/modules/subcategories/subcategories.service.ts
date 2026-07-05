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

  formatSubcategoryAdmin,

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



    return formatSubcategoryAdmin(subcategory);

  }



  async create(

    categoryId: string,

    dto: CreateSubcategoryDto,

  ): Promise<SubcategoryAdmin> {

    await this.assertCategoryExists(categoryId);



    const slug = dto.slug ?? slugify(dto.name);

    this.assertSlug(slug);



    const globalAttributeIds = await this.resolveGlobalAttributeIds(

      categoryId,

      dto.globalAttributeIds ?? [],

    );



    try {

      const subcategory = await this.prisma.$transaction(async (tx) => {

        const created = await tx.subcategory.create({

          data: {

            categoryId,

            name: dto.name,

            slug,

            ...(globalAttributeIds.length > 0 && {

              globalAttributeLinks: {

                create: globalAttributeIds.map((attributeDefinitionId) => ({

                  attributeDefinitionId,

                })),

              },

            }),

          },

          select: SUBCATEGORY_ADMIN_SELECT,

        });



        return created;

      });



      return formatSubcategoryAdmin(subcategory);

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

      this.assertSlug(dto.slug);

      data.slug = dto.slug;

    }



    const globalAttributeIds =

      dto.globalAttributeIds !== undefined

        ? await this.resolveGlobalAttributeIds(

            existing.categoryId,

            dto.globalAttributeIds,

          )

        : undefined;



    const hasScalarUpdates = dto.name !== undefined || dto.slug !== undefined;

    const hasGlobalUpdates = globalAttributeIds !== undefined;



    if (!hasScalarUpdates && !hasGlobalUpdates) {

      return this.findById(id);

    }



    try {

      const subcategory = await this.prisma.$transaction(async (tx) => {

        if (hasGlobalUpdates) {

          await tx.subcategoryGlobalAttribute.deleteMany({

            where: { subcategoryId: id },

          });



          if (globalAttributeIds!.length > 0) {

            await tx.subcategoryGlobalAttribute.createMany({

              data: globalAttributeIds!.map((attributeDefinitionId) => ({

                subcategoryId: id,

                attributeDefinitionId,

              })),

            });

          }

        }



        if (!hasScalarUpdates) {

          return tx.subcategory.findUniqueOrThrow({

            where: { id },

            select: SUBCATEGORY_ADMIN_SELECT,

          });

        }



        return tx.subcategory.update({

          where: { id },

          data,

          select: SUBCATEGORY_ADMIN_SELECT,

        });

      });



      return formatSubcategoryAdmin(subcategory);

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



  async resolveBySlugs(

    categorySlug: string,

    subcategorySlug: string,

  ): Promise<{ categoryId: string; subcategoryId: string }> {

    const category = await this.prisma.category.findUnique({

      where: { slug: categorySlug },

      select: { id: true },

    });



    if (!category) {

      throw new NotFoundException('category_not_found');

    }



    const subcategory = await this.prisma.subcategory.findFirst({

      where: { categoryId: category.id, slug: subcategorySlug },

      select: { id: true },

    });



    if (!subcategory) {

      throw new NotFoundException('subcategory_not_found');

    }



    return { categoryId: category.id, subcategoryId: subcategory.id };

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



  private async resolveGlobalAttributeIds(

    categoryId: string,

    globalAttributeIds: string[],

  ): Promise<string[]> {

    if (!globalAttributeIds.length) {

      return [];

    }



    const uniqueIds = [...new Set(globalAttributeIds)];



    const attributes = await this.prisma.attributeDefinition.findMany({

      where: {

        id: { in: uniqueIds },

        categoryId,

        isGlobal: true,

      },

      select: { id: true },

    });



    if (attributes.length !== uniqueIds.length) {

      throw new BadRequestException('invalid_global_attribute_ids');

    }



    return uniqueIds;

  }



  private assertSlug(slug: string): void {

    if (!slug) {

      throw new ConflictException('invalid_slug');

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


