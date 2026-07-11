import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum OrderRole {
  BUYER = 'buyer',
  SELLER = 'x',
}

export class FindOrdersQueryDto {
  @ApiPropertyOptional({
    enum: OrderRole,
    description: 'Filter orders where the current user is buyer or seller',
  })
  @IsOptional()
  @IsEnum(OrderRole, { message: 'validation.invalid_order_role' })
  role?: OrderRole;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'validation.invalid_order_status' })
  status?: OrderStatus;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.page_must_be_integer' })
  @Min(1, { message: 'validation.page_min_value' })
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.limit_must_be_integer' })
  @Min(1, { message: 'validation.limit_min_value' })
  @Max(50, { message: 'validation.limit_max_value' })
  limit = 20;
}
