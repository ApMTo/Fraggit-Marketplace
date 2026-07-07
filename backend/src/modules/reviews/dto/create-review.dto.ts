import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class CreateReviewDto {
  @ApiProperty({ description: 'Approved order id to review' })
  @IsUUID('4', { message: V.invalidUuid })
  orderId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'validation.rating_must_be_integer' })
  @Min(1, { message: 'validation.rating_min_value' })
  @Max(5, { message: 'validation.rating_max_value' })
  rating!: number;

  @ApiProperty({ example: 'Fast delivery, everything as described.' })
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.review_text_required' })
  @MaxLength(2000, { message: 'validation.review_text_max_length' })
  text!: string;
}
