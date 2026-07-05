import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
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

function parseKeepImageIds(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  let parsed: unknown = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return parsed;
}

export class UpdateLotDto {
  @ApiProperty({ example: 'PUBG account level 78', minLength: 3, maxLength: 200 })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: 'validation.lot_title_min_length' })
  @MaxLength(200, { message: 'validation.lot_title_max_length' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @ApiPropertyOptional({
    example: 'Diamond rank, many skins included.',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(5000, { message: 'validation.lot_description_max_length' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
  })
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
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 1;
    }
    return value;
  })
  stock?: number;

  @ApiProperty({
    type: [LotAttributeInputDto],
    description: 'JSON array of attribute values. Pass as string in multipart form-data.',
  })
  @Transform(({ value }) => parseAttributes(value))
  @IsArray({ message: 'validation.lot_attributes_must_be_array' })
  @ValidateNested({ each: true })
  @Type(() => LotAttributeInputDto)
  @ArrayMinSize(0)
  attributes!: LotAttributeInputDto[];

  @ApiProperty({
    type: [String],
    description:
      'JSON array of existing lot image ids to keep, in display order. Pass as string in multipart form-data.',
    example: '["image-uuid-1","image-uuid-2"]',
  })
  @Transform(({ value }) => parseKeepImageIds(value))
  @IsArray({ message: 'validation.lot_keep_image_ids_must_be_array' })
  @IsUUID('4', { each: true, message: 'validation.invalid_image_id' })
  @ArrayMaxSize(5, { message: 'validation.lot_images_max_count' })
  keepImageIds!: string[];
}
