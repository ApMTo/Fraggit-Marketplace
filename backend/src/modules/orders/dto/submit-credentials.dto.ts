import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';

export class SubmitCredentialsDto {
  @ApiProperty({
    description: 'Delivery data for the buyer (login/password, key, etc.)',
    example: 'login: player1\npassword: secret123',
  })
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.credentials_required' })
  @MaxLength(10_000, { message: 'validation.credentials_max_length' })
  credentials!: string;
}
