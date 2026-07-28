import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class ConfirmTwoFactorEnableDto {
  @ApiProperty({ example: '482913', minLength: 6, maxLength: 6 })
  @IsString({ message: V.mustBeString })
  @Length(6, 6, { message: 'validation.invalid_code' })
  @Matches(/^\d{6}$/, { message: 'validation.invalid_code' })
  code!: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({ example: 'CurrentPass1!' })
  @IsString({ message: V.passwordRequired })
  @MinLength(8, { message: V.passwordMinLength })
  currentPassword!: string;
}
