import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldSecurePass1!' })
  @IsString({ message: V.passwordRequired })
  @MinLength(8, { message: V.passwordMinLength })
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePass1!', minLength: 10 })
  @IsString({ message: V.passwordRequired })
  @MinLength(10, { message: V.passwordMinLength10 })
  newPassword!: string;

  @ApiProperty({ example: 'NewSecurePass1!', minLength: 10 })
  @IsString({ message: V.passwordRequired })
  @MinLength(10, { message: V.passwordMinLength10 })
  confirmPassword!: string;
}
