import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import {
  trimLowerUsername,
  trimOptionalSearch,
} from '../../../common/utils/dto-transform.util';
import { LotSort } from './find-lots.query.dto';

export class FindSellerLotsQueryDto {
  @ApiPropertyOptional({
    description: 'Seller username (preferred for public profile pages)',
    example: 'cool_seller',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: V.usernameLength })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'validation.username_format' })
  @Transform(trimLowerUsername)
  sellerUsername?: string;

  @ApiPropertyOptional({
    description: 'Seller id (UUID). Use when username is not available.',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Search by title, description, or attribute values',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(200, { message: 'validation.search_max_length' })
  @Transform(trimOptionalSearch)
  search?: string;

  @ApiPropertyOptional({
    enum: LotSort,
    default: LotSort.DEFAULT,
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
