import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class FindModerationUsersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class UpdateUserStatusDto {
  @ApiPropertyOptional({
    enum: [UserStatus.ACTIVE, UserStatus.BANNED, UserStatus.SUSPENDED],
  })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  suspendedUntil?: Date;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}

export class ModerationReasonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}
