import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimOptionalSlug } from '../../../common/utils/dto-transform.util';
import { LocalizedNameDto } from './localized-name.dto';

export class CreateSubcategoryDto {
  @ApiProperty({ type: LocalizedNameDto })
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  name!: LocalizedNameDto;

  @ApiPropertyOptional({
    example: 'accounts',
    description:
      'URL-friendly identifier within the category. Generated from English name when omitted.',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(100, { message: 'validation.slug_max_length' })
  @Transform(trimOptionalSlug)
  slug?: string;

  @ApiPropertyOptional({
    example: ['global-attribute-uuid'],
    description:
      'Global category attribute IDs to include in this subcategory (e.g. Platform).',
  })
  @IsOptional()
  @IsArray({ message: 'validation.global_attribute_ids_must_be_array' })
  @ArrayUnique({ message: 'validation.global_attribute_ids_must_be_unique' })
  @IsString({ each: true, message: V.mustBeString })
  globalAttributeIds?: string[];
}
