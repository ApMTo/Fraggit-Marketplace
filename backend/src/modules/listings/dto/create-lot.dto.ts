import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import {
  defaultStock,
  trimOptionalNullableText,
  trimString,
} from '../../../common/utils/dto-transform.util';
import { LotAttributeInputDto } from './lot-attribute-input.dto';

function parseAttributes(value: unknown): unknown {
  let parsed: unknown = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  if (!Array.isArray(parsed)) {
    return parsed;
  }

  return plainToInstance(LotAttributeInputDto, parsed);
}

export class CreateLotDto {
  @ApiProperty({
    example: 'PUBG account level 78',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: 'validation.lot_title_min_length' })
  @MaxLength(200, { message: 'validation.lot_title_max_length' })
  @Transform(trimString)
  title!: string;

  @ApiPropertyOptional({
    example: 'Diamond rank, many skins included.',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(5000, { message: 'validation.lot_description_max_length' })
  @Transform(trimOptionalNullableText)
  description?: string | null;

  @ApiProperty({ example: 49.99, minimum: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'validation.invalid_price' })
  @Min(1, { message: 'validation.price_min_value' })
  price!: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Available quantity. Defaults to 1 when omitted.',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.stock_must_be_integer' })
  @Min(1, { message: 'validation.stock_min_value' })
  @Transform(defaultStock)
  stock?: number;

  @ApiProperty({ example: 'clxyz123categoryid' })
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.category_id_required' })
  categoryId!: string;

  @ApiProperty({ example: 'clxyz123subcategoryid' })
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.subcategory_id_required' })
  subcategoryId!: string;

  @ApiProperty({
    type: [LotAttributeInputDto],
    description:
      'JSON array of attribute values. Pass as string in multipart form-data.',
  })
  @Transform(({ value }: { value: unknown }) => parseAttributes(value))
  @IsArray({ message: 'validation.lot_attributes_must_be_array' })
  @ValidateNested({ each: true })
  @Type(() => LotAttributeInputDto)
  @ArrayMinSize(0)
  attributes!: LotAttributeInputDto[];
}
