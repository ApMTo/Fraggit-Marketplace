import { ApiProperty } from '@nestjs/swagger';
import { Transform, plainToInstance } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { V } from '../../../common/constants/validation.messages';
import { trimString } from '../../../common/utils/dto-transform.util';

export class LocalizedBlogTextDto {
  @ApiProperty({ example: 'How escrow works', minLength: 3, maxLength: 200 })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: 'validation.blog_title_min_length' })
  @MaxLength(200, { message: 'validation.blog_title_max_length' })
  @Transform(trimString)
  en!: string;

  @ApiProperty({ example: 'Как работает эскроу', minLength: 3, maxLength: 200 })
  @IsString({ message: V.mustBeString })
  @MinLength(3, { message: 'validation.blog_title_min_length' })
  @MaxLength(200, { message: 'validation.blog_title_max_length' })
  @Transform(trimString)
  ru!: string;
}

export class LocalizedBlogContentDto {
  @ApiProperty({
    example: '## Safe deals\n\nUse **escrow**.',
    minLength: 1,
    maxLength: 100_000,
  })
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.blog_content_required' })
  @MaxLength(100_000, { message: 'validation.blog_content_max_length' })
  @Transform(trimString)
  en!: string;

  @ApiProperty({
    example: '## Безопасные сделки\n\nИспользуйте **эскроу**.',
    minLength: 1,
    maxLength: 100_000,
  })
  @IsString({ message: V.mustBeString })
  @MinLength(1, { message: 'validation.blog_content_required' })
  @MaxLength(100_000, { message: 'validation.blog_content_max_length' })
  @Transform(trimString)
  ru!: string;
}

function parseJsonObject(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

/** Multipart sends nested objects as JSON strings. */
export function ParseLocalizedBlogTitle() {
  return Transform(({ value }: { value: unknown }) => {
    const parsed = parseJsonObject(value);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return parsed;
    }

    return plainToInstance(LocalizedBlogTextDto, parsed);
  });
}

export function ParseLocalizedBlogContent() {
  return Transform(({ value }: { value: unknown }) => {
    const parsed = parseJsonObject(value);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return parsed;
    }

    return plainToInstance(LocalizedBlogContentDto, parsed);
  });
}
