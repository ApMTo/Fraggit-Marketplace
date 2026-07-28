export type ApiResponse<T> = {
  data: T;
  statusCode: number;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type {
  AuthUser,
  AuthSessionResponse,
  AuthMessageResponse,
  AuthProfileResponse,
  VerifyUserResponse,
  LogoutResponse,
  RegisterPayload,
  LoginPayload,
  UserRole,
  ApiErrorBody,
} from './auth';

export type {
  UserStatus,
  UserProfile,
  UserPublicProfile,
  UserProfileResponse,
  UserPublicProfileResponse,
  UpdateProfilePayload,
} from './user';

export {
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_AVATAR_ACCEPT,
} from './user';

export type {
  AttributeType,
  LocalizedName,
  CategoryPublic,
  CategoryAdmin,
  SubcategoryPublic,
  SubcategoryAdmin,
  AttributeDefinitionPublic,
  AttributeDefinitionAdmin,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateSubcategoryPayload,
  UpdateSubcategoryPayload,
  CreateAttributeDefinitionPayload,
  UpdateAttributeDefinitionPayload,
} from './category';

export { ATTRIBUTE_TYPES, OPTION_ATTRIBUTE_TYPES } from './category';

export type {
  LotStatus,
  LotType,
  LotSort,
  LotImage,
  LotListAttribute,
  LotSeller,
  LotListItem,
  LotDetailAttribute,
  LotDetail,
  LotListResult,
  FindLotsParams,
  FindSellerLotsParams,
  LotAttributeInputValue,
  CreateLotAttributeInput,
  CreateLotPayload,
  UpdateLotPayload,
} from './lot';

export {
  LOT_SORT_OPTIONS,
  DEFAULT_LOTS_LIMIT,
  MAX_LOT_PHOTOS,
  LOT_PHOTO_ACCEPT,
  LOT_PHOTO_MAX_BYTES,
} from './lot';

export type {
  OrderStatus,
  OrderRole,
  OrderUser,
  OrderLot,
  OrderDetail,
  OrderListItem,
  OrderListResult,
  FindOrdersParams,
  CreateOrderPayload,
  SubmitCredentialsPayload,
} from './order';

export type {
  ReviewUser,
  ReviewLot,
  ReviewDetail,
  ReviewListItem,
  ReviewListResult,
  FindReviewsParams,
  CreateReviewPayload,
} from './review';
