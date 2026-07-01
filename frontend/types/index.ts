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
