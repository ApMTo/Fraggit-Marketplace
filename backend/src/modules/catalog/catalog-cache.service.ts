import { Injectable } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import {
  CATALOG_CACHE_KEYS,
  CATALOG_CACHE_PATTERNS,
  CATALOG_CACHE_TTL_SECONDS,
} from './constants/catalog-cache.constants';

@Injectable()
export class CatalogCacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), CATALOG_CACHE_TTL_SECONDS);
  }

  async invalidateCategories(): Promise<void> {
    await this.redis.del(CATALOG_CACHE_KEYS.categories());
  }

  async invalidateSubcategories(categoryId: string): Promise<void> {
    await this.redis.del(CATALOG_CACHE_KEYS.subcategories(categoryId));
  }

  async invalidateFilterableAttributes(subcategoryId: string): Promise<void> {
    await this.redis.delByPattern(`catalog:filter-attrs:${subcategoryId}:*`);
  }

  async invalidateAllFilterableAttributes(): Promise<void> {
    await this.redis.delByPattern(CATALOG_CACHE_PATTERNS.filterableAttributes);
  }

  async invalidateSlugResolution(
    categorySlug: string,
    subcategorySlug: string,
  ): Promise<void> {
    await this.redis.del(
      CATALOG_CACHE_KEYS.slugResolution(categorySlug, subcategorySlug),
    );
  }

  async invalidateAllSlugResolutions(): Promise<void> {
    await this.redis.delByPattern(CATALOG_CACHE_PATTERNS.slugResolutions);
  }
}
