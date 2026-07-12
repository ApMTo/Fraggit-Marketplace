import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttributeType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ATTRIBUTE_DEFINITION_ADMIN_SELECT,
  ATTRIBUTE_DEFINITION_PUBLIC_SELECT,
  ATTRIBUTE_DEFINITION_VALIDATION_SELECT,
  applicableAttributesWhere,
  filterableAttributesWhere,
  AttributeDefinitionAdmin,
  AttributeDefinitionForValidation,
  AttributeDefinitionPublic,
  parseAttributeOptions,
} from './constants/attribute-definition.select';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';

@Injectable()
export class AttributeDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  findGlobalByCategoryId(
    categoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    return this.prisma.attributeDefinition.findMany({
      where: { categoryId, isGlobal: true, subcategoryId: null },
      select: ATTRIBUTE_DEFINITION_PUBLIC_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  findBySubcategoryId(
    subcategoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    return this.resolveSubcategoryContext(subcategoryId).then(
      ({ categoryId }) =>
        this.prisma.attributeDefinition.findMany({
          where: applicableAttributesWhere(categoryId, subcategoryId),
          select: ATTRIBUTE_DEFINITION_PUBLIC_SELECT,
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        }),
    );
  }

  findFilterableForSubcategory(
    subcategoryId: string,
  ): Promise<AttributeDefinitionForValidation[]> {
    return this.resolveSubcategoryContext(subcategoryId).then(
      ({ categoryId }) =>
        this.prisma.attributeDefinition.findMany({
          where: filterableAttributesWhere(categoryId, subcategoryId),
          select: ATTRIBUTE_DEFINITION_VALIDATION_SELECT,
          orderBy: { sortOrder: 'asc' },
        }),
    );
  }

  findFilterablePublicForSubcategory(
    subcategoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    return this.resolveSubcategoryContext(subcategoryId).then(
      ({ categoryId }) =>
        this.prisma.attributeDefinition.findMany({
          where: filterableAttributesWhere(categoryId, subcategoryId),
          select: ATTRIBUTE_DEFINITION_PUBLIC_SELECT,
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        }),
    );
  }

  findApplicableForSubcategory(
    subcategoryId: string,
  ): Promise<AttributeDefinitionForValidation[]> {
    return this.resolveSubcategoryContext(subcategoryId).then(
      ({ categoryId }) =>
        this.prisma.attributeDefinition.findMany({
          where: applicableAttributesWhere(categoryId, subcategoryId),
          select: ATTRIBUTE_DEFINITION_VALIDATION_SELECT,
          orderBy: { sortOrder: 'asc' },
        }),
    );
  }

  async findById(id: string): Promise<AttributeDefinitionAdmin> {
    const attribute = await this.prisma.attributeDefinition.findUnique({
      where: { id },
      select: ATTRIBUTE_DEFINITION_ADMIN_SELECT,
    });

    if (!attribute) {
      throw new NotFoundException('attribute_definition_not_found');
    }

    return attribute;
  }

  async createForCategory(
    categoryId: string,
    dto: CreateAttributeDefinitionDto,
  ): Promise<AttributeDefinitionAdmin> {
    await this.assertCategoryExists(categoryId);
    this.assertOptionsForType(dto.type, dto.options);
    await this.assertGlobalKeyAvailable(categoryId, dto.key);

    try {
      return await this.prisma.attributeDefinition.create({
        data: {
          categoryId,
          subcategoryId: null,
          isGlobal: true,
          key: dto.key,
          label: dto.label,
          type: dto.type,
          required: dto.required ?? false,
          options: this.serializeOptions(dto.type, dto.options),
          sortOrder: dto.sortOrder ?? 0,
        },
        select: ATTRIBUTE_DEFINITION_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async createForSubcategory(
    subcategoryId: string,
    dto: CreateAttributeDefinitionDto,
  ): Promise<AttributeDefinitionAdmin> {
    const { categoryId } = await this.resolveSubcategoryContext(subcategoryId);
    this.assertOptionsForType(dto.type, dto.options);
    await this.assertSubcategoryKeyAvailable(
      categoryId,
      subcategoryId,
      dto.key,
    );

    try {
      return await this.prisma.attributeDefinition.create({
        data: {
          categoryId,
          subcategoryId,
          isGlobal: false,
          key: dto.key,
          label: dto.label,
          type: dto.type,
          required: dto.required ?? false,
          options: this.serializeOptions(dto.type, dto.options),
          sortOrder: dto.sortOrder ?? 0,
        },
        select: ATTRIBUTE_DEFINITION_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async update(
    id: string,
    dto: UpdateAttributeDefinitionDto,
  ): Promise<AttributeDefinitionAdmin> {
    const current = await this.findById(id);
    const nextType = dto.type ?? current.type;
    const nextOptions =
      dto.options !== undefined
        ? dto.options
        : (parseAttributeOptions(current.options) ?? undefined);

    this.assertOptionsForType(nextType, nextOptions);

    if (dto.key !== undefined && dto.key !== current.key) {
      if (current.isGlobal) {
        await this.assertGlobalKeyAvailable(current.categoryId, dto.key, id);
      } else if (current.subcategoryId) {
        await this.assertSubcategoryKeyAvailable(
          current.categoryId,
          current.subcategoryId,
          dto.key,
          id,
        );
      }
    }

    const data: Prisma.AttributeDefinitionUpdateInput = {};

    if (dto.key !== undefined) {
      data.key = dto.key;
    }
    if (dto.label !== undefined) {
      data.label = dto.label;
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.required !== undefined) {
      data.required = dto.required;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.options !== undefined || dto.type !== undefined) {
      data.options = this.serializeOptions(nextType, nextOptions);
    }

    if (!Object.keys(data).length) {
      return current;
    }

    try {
      return await this.prisma.attributeDefinition.update({
        where: { id },
        data,
        select: ATTRIBUTE_DEFINITION_ADMIN_SELECT,
      });
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.attributeDefinition.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('attribute_definition_not_found');
      }
      throw error;
    }
  }

  private async resolveSubcategoryContext(subcategoryId: string): Promise<{
    categoryId: string;
  }> {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      select: { categoryId: true },
    });

    if (!subcategory) {
      throw new NotFoundException('subcategory_not_found');
    }

    return subcategory;
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

  private async assertGlobalKeyAvailable(
    categoryId: string,
    key: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.attributeDefinition.findFirst({
      where: {
        categoryId,
        isGlobal: true,
        key,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('attribute_key_already_exists');
    }
  }

  private async assertSubcategoryKeyAvailable(
    categoryId: string,
    subcategoryId: string,
    key: string,
    excludeId?: string,
  ): Promise<void> {
    const globalConflict = await this.prisma.attributeDefinition.findFirst({
      where: {
        categoryId,
        isGlobal: true,
        key,
      },
      select: { id: true },
    });

    if (globalConflict) {
      throw new ConflictException('attribute_key_conflicts_with_global');
    }

    const localConflict = await this.prisma.attributeDefinition.findFirst({
      where: {
        subcategoryId,
        isGlobal: false,
        key,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });

    if (localConflict) {
      throw new ConflictException('attribute_key_already_exists');
    }
  }

  private assertOptionsForType(type: AttributeType, options?: string[]): void {
    const requiresOptions =
      type === AttributeType.SELECT || type === AttributeType.MULTISELECT;

    if (requiresOptions && (!options || options.length === 0)) {
      throw new BadRequestException('attribute_options_required');
    }

    if (!requiresOptions && options !== undefined) {
      throw new BadRequestException('attribute_options_not_allowed');
    }
  }

  private serializeOptions(
    type: AttributeType,
    options?: string[],
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    const requiresOptions =
      type === AttributeType.SELECT || type === AttributeType.MULTISELECT;

    if (!requiresOptions) {
      return Prisma.JsonNull;
    }

    return options ?? [];
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('attribute_key_already_exists');
    }

    throw error;
  }
}
