import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class CreateOrderDto {
  @ApiProperty({ description: 'Lot id to purchase' })
  @IsUUID('4', { message: V.invalidUuid })
  lotId!: string;
}