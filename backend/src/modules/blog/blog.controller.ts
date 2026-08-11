import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  ACCEPT_LANGUAGE_HEADER,
  RequestLocale,
} from '../../common/decorators/request-locale.decorator';
import type { AppLocale } from '../../common/i18n/locale';
import { APP_LOCALES, DEFAULT_LOCALE } from '../../common/i18n/locale';
import { Public } from '../../decorators/public.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { StrictRoles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { FindBlogPostsQueryDto } from './dto/find-blog-posts.query.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

const LOCALE_HEADER = {
  name: ACCEPT_LANGUAGE_HEADER,
  description: `Locale for localized blog title/content (${APP_LOCALES.join(', ')}). Unsupported values fall back to ${DEFAULT_LOCALE}.`,
  required: false,
};

const coverValidationPipe = new FileValidationPipe({
  maxSizeInBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  optional: true,
});

const storageOptions = { storage: memoryStorage() };

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @Public()
  @ApiHeader(LOCALE_HEADER)
  @ApiOperation({ summary: 'Paginated blog posts (newest first)' })
  @ApiResponse({ status: 200, description: 'Blog posts returned' })
  findMany(
    @Query() query: FindBlogPostsQueryDto,
    @RequestLocale() locale: AppLocale,
  ) {
    return this.blogService.findMany(query, locale);
  }

  @Get('latest')
  @Public()
  @ApiHeader(LOCALE_HEADER)
  @ApiOperation({
    summary: 'Latest blog posts for homepage (Redis-cached, 4 items)',
  })
  @ApiResponse({ status: 200, description: 'Latest posts returned' })
  findLatest(@RequestLocale() locale: AppLocale) {
    return this.blogService.findLatest(locale);
  }

  @Get(':slug/editor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.MEDIA)
  @ApiCookieAuth('access_token')
  @ApiHeader(LOCALE_HEADER)
  @ApiOperation({
    summary: 'Get blog post with all locale translations (MEDIA only)',
  })
  @ApiParam({ name: 'slug', description: 'Post URL slug' })
  findEditor(@Param('slug') slug: string, @RequestLocale() locale: AppLocale) {
    return this.blogService.findEditorBySlug(slug, locale);
  }

  @Get(':slug')
  @Public()
  @ApiHeader(LOCALE_HEADER)
  @ApiOperation({ summary: 'Get blog post by slug (resolved for locale)' })
  @ApiParam({ name: 'slug', description: 'Post URL slug' })
  findOne(@Param('slug') slug: string, @RequestLocale() locale: AppLocale) {
    return this.blogService.findBySlug(slug, locale);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.MEDIA)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiHeader(LOCALE_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'content', 'cover'],
      properties: {
        title: {
          type: 'string',
          description: 'JSON string: { "en": "...", "ru": "..." }',
        },
        slug: { type: 'string' },
        content: {
          type: 'string',
          description: 'JSON string: { "en": "...", "ru": "..." } (markdown)',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Cover image (required)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Create blog post (MEDIA only)' })
  @UseInterceptors(FileInterceptor('cover', storageOptions))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBlogPostDto,
    @RequestLocale() locale: AppLocale,
    @UploadedFile(coverValidationPipe) cover?: Express.Multer.File,
  ) {
    return this.blogService.create(user.id, dto, locale, cover);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.MEDIA)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiHeader(LOCALE_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'JSON string: { "en": "...", "ru": "..." }',
        },
        slug: { type: 'string' },
        content: {
          type: 'string',
          description: 'JSON string: { "en": "...", "ru": "..." }',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Replacement cover image',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Update blog post (MEDIA only)' })
  @ApiParam({ name: 'id', description: 'Post id' })
  @UseInterceptors(FileInterceptor('cover', storageOptions))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
    @RequestLocale() locale: AppLocale,
    @UploadedFile(coverValidationPipe) cover?: Express.Multer.File,
  ) {
    return this.blogService.update(id, dto, locale, cover);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @StrictRoles(UserRole.MEDIA)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Delete blog post (MEDIA only)' })
  @ApiParam({ name: 'id', description: 'Post id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.blogService.remove(id);
  }
}
