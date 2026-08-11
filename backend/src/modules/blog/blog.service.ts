import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AppLocale, LocalizedText } from '../../common/i18n/locale';
import { toLocalizedTextInput } from '../../common/i18n/locale';
import { slugify } from '../../common/utils/slug.util';
import { FilesService } from '../files/files.service';
import { BlogLatestCache } from './blog-latest.cache';
import { BLOG_LATEST_LIMIT } from './constants/blog.constants';
import {
  BLOG_POST_CARD_SELECT,
  BLOG_POST_DETAIL_SELECT,
  formatBlogPostCard,
  formatBlogPostDetail,
  formatBlogPostEditor,
  type BlogPostCard,
  type BlogPostCardRecord,
  type BlogPostDetail,
  type BlogPostEditorDetail,
} from './constants/blog.select';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { FindBlogPostsQueryDto } from './dto/find-blog-posts.query.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

export type BlogPostListResult = {
  items: BlogPostCard[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly latestCache: BlogLatestCache,
  ) {}

  async findMany(
    query: FindBlogPostsQueryDto,
    locale: AppLocale,
  ): Promise<BlogPostListResult> {
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        select: BLOG_POST_CARD_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.blogPost.count(),
    ]);

    return {
      items: rows.map((row) => formatBlogPostCard(row, locale)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findLatest(locale: AppLocale): Promise<BlogPostCard[]> {
    const cached = await this.latestCache.get();
    if (cached) {
      return cached.map((row) =>
        formatBlogPostCard(this.reviveDates(row), locale),
      );
    }

    const posts = await this.loadLatestFromDb();
    await this.latestCache.set(posts);
    return posts.map((row) => formatBlogPostCard(row, locale));
  }

  async findBySlug(slug: string, locale: AppLocale): Promise<BlogPostDetail> {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      select: BLOG_POST_DETAIL_SELECT,
    });

    if (!post) {
      throw new NotFoundException('blog_post_not_found');
    }

    return formatBlogPostDetail(post, locale);
  }

  async findEditorBySlug(
    slug: string,
    locale: AppLocale,
  ): Promise<BlogPostEditorDetail> {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      select: BLOG_POST_DETAIL_SELECT,
    });

    if (!post) {
      throw new NotFoundException('blog_post_not_found');
    }

    return formatBlogPostEditor(post, locale);
  }

  async create(
    authorId: string,
    dto: CreateBlogPostDto,
    locale: AppLocale,
    cover?: Express.Multer.File,
  ): Promise<BlogPostEditorDetail> {
    if (!cover) {
      throw new BadRequestException('blog_cover_required');
    }

    const title = toLocalizedTextInput(dto.title);
    const content = toLocalizedTextInput(dto.content);
    const slug = dto.slug ?? slugify(title.en);
    this.assertSlug(slug);

    const coverUrl = await this.uploadCover(cover);

    try {
      const post = await this.prisma.blogPost.create({
        data: {
          title: this.toJson(title),
          slug,
          content: this.toJson(content),
          coverUrl,
          authorId,
        },
        select: BLOG_POST_DETAIL_SELECT,
      });

      await this.refreshLatestCache();
      return formatBlogPostEditor(post, locale);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async update(
    id: string,
    dto: UpdateBlogPostDto,
    locale: AppLocale,
    cover?: Express.Multer.File,
  ): Promise<BlogPostEditorDetail> {
    await this.assertExists(id);

    const data: Prisma.BlogPostUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = this.toJson(toLocalizedTextInput(dto.title));
    }

    if (dto.slug !== undefined) {
      this.assertSlug(dto.slug);
      data.slug = dto.slug;
    }

    if (dto.content !== undefined) {
      data.content = this.toJson(toLocalizedTextInput(dto.content));
    }

    if (cover) {
      data.coverUrl = await this.uploadCover(cover);
    }

    if (!Object.keys(data).length) {
      return this.findEditorById(id, locale);
    }

    try {
      const post = await this.prisma.blogPost.update({
        where: { id },
        data,
        select: BLOG_POST_DETAIL_SELECT,
      });

      await this.refreshLatestCache();
      return formatBlogPostEditor(post, locale);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.blogPost.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('blog_post_not_found');
      }
      throw error;
    }

    await this.refreshLatestCache();
  }

  private async findEditorById(
    id: string,
    locale: AppLocale,
  ): Promise<BlogPostEditorDetail> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: BLOG_POST_DETAIL_SELECT,
    });

    if (!post) {
      throw new NotFoundException('blog_post_not_found');
    }

    return formatBlogPostEditor(post, locale);
  }

  private async loadLatestFromDb(): Promise<BlogPostCardRecord[]> {
    return this.prisma.blogPost.findMany({
      select: BLOG_POST_CARD_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: BLOG_LATEST_LIMIT,
    });
  }

  private async refreshLatestCache(): Promise<void> {
    const posts = await this.loadLatestFromDb();
    await this.latestCache.refresh(posts);
  }

  private async uploadCover(file: Express.Multer.File): Promise<string> {
    const uploaded = await this.filesService.uploadFile(file, 'blog/covers');
    return uploaded.url;
  }

  private async assertExists(id: string): Promise<void> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('blog_post_not_found');
    }
  }

  private assertSlug(slug: string): void {
    if (!slug) {
      throw new ConflictException('invalid_slug');
    }
  }

  private toJson(text: LocalizedText): Prisma.InputJsonValue {
    return text;
  }

  /** Redis JSON loses Date instances — restore before formatting. */
  private reviveDates(row: BlogPostCardRecord): BlogPostCardRecord {
    return {
      ...row,
      publishedAt:
        row.publishedAt instanceof Date
          ? row.publishedAt
          : new Date(row.publishedAt),
    };
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target as string[] | undefined;

      if (target?.includes('slug')) {
        throw new ConflictException('blog_slug_already_exists');
      }

      throw new ConflictException('unique_constraint_failed');
    }

    throw error;
  }
}
