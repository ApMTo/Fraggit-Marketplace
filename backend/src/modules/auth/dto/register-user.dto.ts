import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class RegisterUserDto {
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

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: V.invalidEmail })
  email!: string;

  @ApiProperty({
    example: 'SecurePass1!',
    minLength: 10,
    description:
      'Min 8 chars, upper, lower, digit, special character (registration enforces full policy)',
  })
  @IsString({ message: V.passwordRequired })
  @MinLength(10, { message: V.passwordMinLength10 })
  password!: string;

  @ApiProperty({ example: true })
  @IsBoolean({ message: V.mustBeBoolean })
  @Equals(true, { message: 'terms_acceptance_required' })
  acceptedTerms!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean({ message: V.mustBeBoolean })
  @Equals(true, { message: 'privacy_acceptance_required' })
  acceptedPrivacy!: boolean;
}
