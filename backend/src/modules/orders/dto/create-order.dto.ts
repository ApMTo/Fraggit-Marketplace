import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimString } from '../../../common/utils/dto-transform.util';

export class CreateOrderDto {
  @ApiProperty({ description: 'Lot id to purchase' })
  @IsUUID('4', { message: V.invalidUuid })
  lotId!: string;

  @ApiPropertyOptional({
    description:
      'Required when purchasing a SERVICE lot. Answer to the seller question.',
    example: 'Player ID: 5123456789\nServer: EU',
    maxLength: 5000,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.buyer_answer_required' })
  @MaxLength(5000, { message: 'validation.buyer_answer_max_length' })
  @Transform(trimString)
  buyerAnswer?: string;
}
