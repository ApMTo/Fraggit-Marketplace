import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BLOG_PAGE_SIZE } from '../constants/blog.constants';

export class FindBlogPostsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.page_must_be_integer' })
  @Min(1, { message: 'validation.page_min_value' })
  page = 1;

  @ApiPropertyOptional({
    default: BLOG_PAGE_SIZE,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.limit_must_be_integer' })
  @Min(1, { message: 'validation.limit_min_value' })
  @Max(50, { message: 'validation.limit_max_value' })
  limit = BLOG_PAGE_SIZE;
}
