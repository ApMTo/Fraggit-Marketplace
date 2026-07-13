import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  ratingCount!: number;

  @ApiProperty()
  successfulSales!: number;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiPropertyOptional({ nullable: true })
  telegramUsername!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class UserPublicProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  ratingCount!: number;

  @ApiProperty()
  successfulSales!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: { code: 'messages.profile_data' } })
  message!: { code: string };

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}

export class UserPublicProfileResponseDto {
  @ApiProperty({ example: { code: 'messages.profile_data' } })
  message!: { code: string };

  @ApiProperty({ type: UserPublicProfileDto })
  user!: UserPublicProfileDto;
}
