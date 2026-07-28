import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class ResendTwoFactorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID('4', { message: V.invalidToken })
  challengeId!: string;
}
