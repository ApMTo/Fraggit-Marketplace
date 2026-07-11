import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimOptionalSearch } from '../../../common/utils/dto-transform.util';

export enum LotSort {
  DEFAULT = 'default',
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

function parseFilters(
  value: unknown,
): Record<string, string | number | boolean> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string | number | boolean>;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, string | number | boolean>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export class FindLotsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by title, description, or attribute values',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(200, { message: 'validation.search_max_length' })
  @Transform(trimOptionalSearch)
  search?: string;

  @ApiPropertyOptional({
    description:
      'Attribute filters by key, e.g. {"platform":"XBOX","rank":"Diamond"}. Pass as JSON string.',
    example: '{"platform":"XBOX","rank":"Diamond"}',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseFilters(value) ?? {})
  @IsObject({ message: 'validation.lot_filters_must_be_object' })
  filters: Record<string, string | number | boolean> = {};

  @ApiPropertyOptional({
    enum: LotSort,
    default: LotSort.DEFAULT,
    description: 'default/newest → createdAt desc, price_asc, price_desc',
  })
  @IsOptional()
  @IsEnum(LotSort, { message: 'validation.invalid_lot_sort' })
  sort: LotSort = LotSort.DEFAULT;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.page_must_be_integer' })
  @Min(1, { message: 'validation.page_min_value' })
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.limit_must_be_integer' })
  @Min(1, { message: 'validation.limit_min_value' })
  @Max(50, { message: 'validation.limit_max_value' })
  limit = 20;
}
