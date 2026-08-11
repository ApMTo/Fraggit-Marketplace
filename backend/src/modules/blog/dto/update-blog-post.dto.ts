import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimLowerString } from '../../../common/utils/dto-transform.util';
import {
  LocalizedBlogContentDto,
  LocalizedBlogTextDto,
  ParseLocalizedBlogContent,
  ParseLocalizedBlogTitle,
} from './localized-blog-text.dto';

export class UpdateBlogPostDto {
  @ApiPropertyOptional({ type: LocalizedBlogTextDto })
  @IsOptional()
  @ParseLocalizedBlogTitle()
  @ValidateNested()
  @Type(() => LocalizedBlogTextDto)
  title?: LocalizedBlogTextDto;

  @ApiPropertyOptional({ example: 'how-escrow-works' })
  @IsOptional()
  @IsString({ message: V.mustBeString })
  @IsNotEmpty({ message: 'validation.slug_required' })
  @MaxLength(200, { message: 'validation.slug_max_length' })
  @Transform(trimLowerString)
  slug?: string;

  @ApiPropertyOptional({ type: LocalizedBlogContentDto })
  @IsOptional()
  @ParseLocalizedBlogContent()
  @ValidateNested()
  @Type(() => LocalizedBlogContentDto)
  content?: LocalizedBlogContentDto;
}
