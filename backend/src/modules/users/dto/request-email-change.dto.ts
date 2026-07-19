import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimLowerString } from '../../../common/utils/dto-transform.util';

export class RequestEmailChangeDto {
  @ApiProperty({ example: 'new@example.com' })
  @IsEmail({}, { message: V.invalidEmail })
  @Transform(trimLowerString)
  newEmail!: string;
}
