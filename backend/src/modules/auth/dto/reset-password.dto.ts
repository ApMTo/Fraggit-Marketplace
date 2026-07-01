import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Token from the password reset email link',
  })
  @IsUUID('4', { message: V.invalidToken })
  token!: string;

  @ApiProperty({ example: 'NewSecurePass1!', minLength: 8 })
  @IsString({ message: V.passwordRequired })
  @MinLength(8, { message: V.passwordMinLength })
  password!: string;

  @ApiProperty({ example: 'NewSecurePass1!', minLength: 8 })
  @IsString({ message: V.passwordRequired })
  @MinLength(8, { message: V.passwordMinLength })
  confirmPassword!: string;
}
