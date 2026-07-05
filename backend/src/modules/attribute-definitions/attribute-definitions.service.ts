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
  AttributeDefinitionAdmin,
  AttributeDefinitionPublic,
  parseAttributeOptions,
} from './constants/attribute-definition.select';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';

@Injectable()
export class AttributeDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  findBySubcategoryId(
    subcategoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    return this.prisma.attributeDefinition.findMany({
      where: { subcategoryId },
      select: ATTRIBUTE_DEFINITION_PUBLIC_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
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

  async create(
    subcategoryId: string,
    dto: CreateAttributeDefinitionDto,
  ): Promise<AttributeDefinitionAdmin> {
    await this.assertSubcategoryExists(subcategoryId);
    this.assertOptionsForType(dto.type, dto.options);

    try {
      return await this.prisma.attributeDefinition.create({
        data: {
          subcategoryId,
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
      this.rethrowUniqueConflict(error, 'attribute_key_already_exists');
      throw error;
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
        : parseAttributeOptions(current.options) ?? undefined;

    this.assertOptionsForType(nextType, nextOptions);

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
      this.rethrowUniqueConflict(error, 'attribute_key_already_exists');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.attributeDefinition.delete({ where: { id } });
  }

  private async assertSubcategoryExists(subcategoryId: string): Promise<void> {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      select: { id: true },
    });

    if (!subcategory) {
      throw new NotFoundException('subcategory_not_found');
    }
  }

  private assertOptionsForType(
    type: AttributeType,
    options?: string[],
  ): void {
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

  private rethrowUniqueConflict(error: unknown, code: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(code);
    }
  }
}
