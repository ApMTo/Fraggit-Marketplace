import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class CreateSubcategoryDto {
  @ApiProperty({ example: 'Accounts', minLength: 2, maxLength: 100 })
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.subcategory_name_min_length' })
  @MaxLength(100, { message: 'validation.subcategory_name_max_length' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @ApiPropertyOptional({
    example: 'accounts',
    description: 'URL-friendly identifier within the category. Generated from name when omitted.',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(100, { message: 'validation.slug_max_length' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  })
  slug?: string;
}
