import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class LoginUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: V.invalidEmail })
  email!: string;

  @ApiProperty({ example: 'SecurePass1!', minLength: 8 })
  @IsString({ message: V.passwordRequired })
  @MinLength(8, { message: V.passwordMinLength })
  password!: string;
}
