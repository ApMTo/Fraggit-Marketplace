import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import {
  trimLowerString,
  trimString,
  trimStringArray,
} from '../../../common/utils/dto-transform.util';

const ATTRIBUTE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export class UpdateAttributeDefinitionDto {
  @ApiPropertyOptional({ example: 'platform', minLength: 2, maxLength: 50 })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.attribute_key_min_length' })
  @MaxLength(50, { message: 'validation.attribute_key_max_length' })
  @Matches(ATTRIBUTE_KEY_PATTERN, {
    message: 'validation.attribute_key_format',
  })
  @Transform(trimLowerString)
  key?: string;

  @ApiPropertyOptional({ example: 'Platform', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: 'validation.attribute_label_min_length' })
  @MaxLength(100, { message: 'validation.attribute_label_max_length' })
  @Transform(trimString)
  label?: string;

  @ApiPropertyOptional({ enum: AttributeType })
  @IsOptional()
  @IsEnum(AttributeType, { message: 'validation.invalid_attribute_type' })
  type?: AttributeType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'validation.must_be_boolean' })
  required?: boolean;

  @ApiPropertyOptional({ example: ['PC', 'XBOX', 'PS'] })
  @IsOptional()
  @IsArray({ message: 'validation.attribute_options_must_be_array' })
  @ArrayMinSize(1, { message: 'validation.attribute_options_min_size' })
  @IsString({ each: true, message: V.mustBeString })
  @Transform(trimStringArray)
  options?: string[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.sort_order_must_be_integer' })
  @Min(0, { message: 'validation.sort_order_min_value' })
  sortOrder?: number;
}
