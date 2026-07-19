import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimLowerUsername } from '../../../common/utils/dto-transform.util';

export class ChangeUsernameDto {
  @ApiProperty({ example: 'cool_seller', minLength: 3 })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: V.usernameLength })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'validation.username_format' })
  @Transform(trimLowerUsername)
  username!: string;
}
