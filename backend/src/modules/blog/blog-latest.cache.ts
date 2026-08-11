import { Injectable } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import {
  BLOG_LATEST_CACHE_KEY,
  BLOG_LATEST_CACHE_TTL_SECONDS,
} from './constants/blog.constants';
import type { BlogPostCardRecord } from './constants/blog.select';

@Injectable()
export class BlogLatestCache {
  constructor(private readonly redis: RedisService) {}

  async get(): Promise<BlogPostCardRecord[] | null> {
    const raw = await this.redis.get(BLOG_LATEST_CACHE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return null;
      }
      return parsed as BlogPostCardRecord[];
    } catch {
      return null;
    }
  }

  async set(posts: BlogPostCardRecord[]): Promise<void> {
    await this.redis.set(
      BLOG_LATEST_CACHE_KEY,
      JSON.stringify(posts),
      BLOG_LATEST_CACHE_TTL_SECONDS,
    );
  }

  async refresh(posts: BlogPostCardRecord[]): Promise<void> {
    await this.set(posts);
  }
}
