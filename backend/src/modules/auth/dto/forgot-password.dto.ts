import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: V.invalidEmail })
  email!: string;
}
