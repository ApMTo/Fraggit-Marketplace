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

export class UpdateSubcategoryDto {
  @ApiPropertyOptional({ example: 'Premium Accounts', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.subcategory_name_min_length' })
  @MaxLength(100, { message: 'validation.subcategory_name_max_length' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({ example: 'premium-accounts' })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.slug_required' })
  @MaxLength(100, { message: 'validation.slug_max_length' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;
}
