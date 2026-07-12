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
  AttributeType,
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
