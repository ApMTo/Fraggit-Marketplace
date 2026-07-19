import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class ConfirmEmailChangeDto {
  @ApiProperty({ example: '482913', minLength: 6, maxLength: 6 })
  @IsString({ message: V.mustBeString })
  @Length(6, 6, { message: 'validation.invalid_code' })
  @Matches(/^\d{6}$/, { message: 'validation.invalid_code' })
  code!: string;
}
