import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimLowerString } from '../../../common/utils/dto-transform.util';
import { LocalizedNameDto } from './localized-name.dto';

export class UpdateSubcategoryDto {
  @ApiPropertyOptional({ type: LocalizedNameDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  name?: LocalizedNameDto;

  @ApiPropertyOptional({ example: 'premium-accounts' })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.slug_required' })
  @MaxLength(100, { message: 'validation.slug_max_length' })
  @Transform(trimLowerString)
  slug?: string;

  @ApiPropertyOptional({
    example: ['global-attribute-uuid'],
    description:
      'Replaces linked global category attributes for this subcategory.',
  })
  @IsOptional()
  @IsArray({ message: 'validation.global_attribute_ids_must_be_array' })
  @ArrayUnique({ message: 'validation.global_attribute_ids_must_be_unique' })
  @IsString({ each: true, message: V.mustBeString })
  globalAttributeIds?: string[];
}
