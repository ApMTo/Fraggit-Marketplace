import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class CreateLotDisputeMessageDto {
  @ApiPropertyOptional({
    maxLength: 4000,
    description: 'Text body. Required when no image url is sent.',
  })
  @ValidateIf((dto: CreateLotDisputeMessageDto) => !dto.url)
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.message_required' })
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ description: 'Public HTTPS URL of an uploaded image' })
  @ValidateIf((dto: CreateLotDisputeMessageDto) => !dto.body?.trim())
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.url_required' })
  @MaxLength(2048, { message: 'validation.url_too_long' })
  url?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @ValidateIf((dto: CreateLotDisputeMessageDto) => Boolean(dto.url))
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: 'validation.mime_type_required' })
  @MaxLength(100, { message: 'validation.mime_type_too_long' })
  mimeType?: string;

  @ApiPropertyOptional({ example: 102400 })
  @ValidateIf((dto: CreateLotDisputeMessageDto) => Boolean(dto.url))
  @Type(() => Number)
  @IsInt({ message: 'validation.file_size_must_be_integer' })
  @Min(1, { message: 'validation.file_size_min_value' })
  @Max(5_242_880, { message: 'validation.file_size_max_value' })
  size?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.width_must_be_integer' })
  @Min(1, { message: 'validation.width_min_value' })
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.height_must_be_integer' })
  @Min(1, { message: 'validation.height_min_value' })
  height?: number;
}

export class LotDisputeMessagesQueryDto {
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
