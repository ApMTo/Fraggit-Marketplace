import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import {
  trimLowerUsername,
  trimOptionalNullableText,
  trimString,
} from '../../../common/utils/dto-transform.util';

export class UpdateProfileDto {
  @ApiProperty({ example: 'cool_seller', minLength: 3 })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: V.usernameLength })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'validation.username_format' })
  @Transform(trimLowerUsername)
  username!: string;

  @ApiProperty({ example: 'Cool Seller', minLength: 2 })
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: V.displayNameLength })
  @Transform(trimString)
  displayName!: string;

  @ApiPropertyOptional({ example: 'CS2 skins trader', maxLength: 500 })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(500, { message: V.bioMaxLength })
  @Transform(trimOptionalNullableText)
  bio?: string | null;
}
