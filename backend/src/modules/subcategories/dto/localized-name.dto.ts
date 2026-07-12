import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimString } from '../../../common/utils/dto-transform.util';

function trimOptionalLocalizedName({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return typeof value === 'string' ? value.trim() || undefined : value;
}

export class LocalizedNameDto {
  @ApiProperty({ example: 'Accounts', minLength: 2, maxLength: 100 })
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.subcategory_name_min_length' })
  @MaxLength(100, { message: 'validation.subcategory_name_max_length' })
  @Transform(trimString)
  en!: string;

  @ApiPropertyOptional({
    example: 'Аккаунты',
    minLength: 2,
    maxLength: 100,
    description: 'Optional Russian translation. Falls back to en when omitted.',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.subcategory_name_min_length' })
  @MaxLength(100, { message: 'validation.subcategory_name_max_length' })
  @Transform(trimOptionalLocalizedName)
  ru?: string;
}
