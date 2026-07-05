import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { LotAttributeInputDto } from './lot-attribute-input.dto';

export class CreateLotDto {
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

  @ApiProperty({ example: 'clxyz123categoryid' })
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.category_id_required' })
  categoryId!: string;

  @ApiProperty({ example: 'clxyz123subcategoryid' })
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.subcategory_id_required' })
  subcategoryId!: string;

  @ApiProperty({ type: [LotAttributeInputDto] })
  @IsArray({ message: 'validation.lot_attributes_must_be_array' })
  @ValidateNested({ each: true })
  @Type(() => LotAttributeInputDto)
  @ArrayMinSize(0)
  attributes!: LotAttributeInputDto[];
}
