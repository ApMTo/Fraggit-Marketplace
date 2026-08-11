import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimOptionalSlug } from '../../../common/utils/dto-transform.util';
import {
  LocalizedBlogContentDto,
  LocalizedBlogTextDto,
  ParseLocalizedBlogContent,
  ParseLocalizedBlogTitle,
} from './localized-blog-text.dto';

export class CreateBlogPostDto {
  @ApiProperty({ type: LocalizedBlogTextDto })
  @ParseLocalizedBlogTitle()
  @ValidateNested()
  @Type(() => LocalizedBlogTextDto)
  title!: LocalizedBlogTextDto;

  @ApiPropertyOptional({
    example: 'how-escrow-works',
    description: 'URL slug. Generated from English title when omitted.',
  })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @MaxLength(200, { message: 'validation.slug_max_length' })
  @Transform(trimOptionalSlug)
  slug?: string;

  @ApiProperty({ type: LocalizedBlogContentDto })
  @ParseLocalizedBlogContent()
  @ValidateNested()
  @Type(() => LocalizedBlogContentDto)
  content!: LocalizedBlogContentDto;
}
