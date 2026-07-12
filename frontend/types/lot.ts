import type { AttributeType } from './category';

export type LotStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

export type LotSort = 'default' | 'newest' | 'price_asc' | 'price_desc';

export type LotImage = {
  id: string;
  url: string;
  sortOrder: number;
};

export type LotListAttribute = {
  key: string;
  label: string;
  value: string;
};

export type LotSeller = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  ratingCount: number;
};

export type LotListItem = {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  stock: number;
  status: LotStatus;
  categoryId: string;
  subcategoryId: string;
  createdAt: string;
  seller: LotSeller;
  attributes: LotListAttribute[];
  images: LotImage[];
};

export type LotDetailAttribute = {
  id: string;
  attributeId: string;
  value: string;
  attribute: {
    key: string;
    label: string;
    type: AttributeType;
  };
};

export type LotDetail = {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  stock: number;
  status: LotStatus;
  sellerId: string;
  categoryId: string;
  subcategoryId: string;
  createdAt: string;
  updatedAt: string;
  seller: LotSeller;
  attributes: LotDetailAttribute[];
  images: LotImage[];
};

export type LotListResult = {
  items: LotListItem[];
  total: number;
  page: number;
  limit: number;
};

export type FindLotsParams = {
  search?: string;
  filters?: Record<string, string | number | boolean>;
  sort?: LotSort;
  page?: number;
  limit?: number;
};

export type LotAttributeInputValue = string | number | boolean | string[];

export type CreateLotAttributeInput = {
  attributeId: string;
  value: LotAttributeInputValue;
};

export type CreateLotPayload = {
  title: string;
  description?: string | null;
  price: number;
  stock?: number;
  categoryId: string;
  subcategoryId: string;
  attributes: CreateLotAttributeInput[];
  photos?: File[];
};

export const LOT_SORT_OPTIONS: LotSort[] = [
  'default',
  'newest',
  'price_asc',
  'price_desc',
];

export const DEFAULT_LOTS_LIMIT = 20;
export const MAX_LOT_PHOTOS = 5;
export const LOT_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const LOT_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
