import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class CompleteGoogleDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Pending Google signup token from OAuth callback redirect',
  })
  @IsString({ message: V.mustBeString })
  @MinLength(10, { message: 'validation.invalid_or_expired_token' })
  token!: string;

  @ApiProperty({ example: 'cool_seller', minLength: 3 })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: V.usernameLength })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'validation.username_format',
  })
  username!: string;

  @ApiProperty({ example: 'Cool Seller', minLength: 2 })
  @IsString({ message: V.mustBeString })
  @MinLength(2, { message: V.displayNameLength })
  displayName!: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: V.mustBeBoolean })
  @Equals(true, { message: 'terms_acceptance_required' })
  acceptedTerms!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean({ message: V.mustBeBoolean })
  @Equals(true, { message: 'privacy_acceptance_required' })
  acceptedPrivacy!: boolean;
}
