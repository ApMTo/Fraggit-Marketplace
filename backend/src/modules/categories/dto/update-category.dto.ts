import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import {
  trimLowerString,
  trimString,
} from '../../../common/utils/dto-transform.util';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'PUBG Mobile', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.category_name_min_length' })
  @MaxLength(100, { message: 'validation.category_name_max_length' })
  @Transform(trimString)
  name?: string;

  @ApiPropertyOptional({ example: 'pubg-mobile' })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.slug_required' })
  @MaxLength(100, { message: 'validation.slug_max_length' })
  @Transform(trimLowerString)
  slug?: string;
}
