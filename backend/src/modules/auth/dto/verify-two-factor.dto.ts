import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length, Matches } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class VerifyTwoFactorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID('4', { message: V.invalidToken })
  challengeId!: string;

  @ApiProperty({ example: '482913', minLength: 6, maxLength: 6 })
  @IsString({ message: V.mustBeString })
  @Length(6, 6, { message: 'validation.invalid_code' })
  @Matches(/^\d{6}$/, { message: 'validation.invalid_code' })
  code!: string;
}
