import api from '@/lib/api';
import type {
  CreateOrderPayload,
  FindOrdersParams,
  OrderDetail,
  OrderListResult,
  SubmitCredentialsPayload,
} from '@/types/order';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: FindOrdersParams) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

function buildOrdersQuery(
  params: FindOrdersParams,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (params.role) {
    query.role = params.role;
  }

  if (params.status) {
    query.status = params.status;
  }

  if (params.page && params.page > 1) {
    query.page = String(params.page);
  }

  if (params.limit) {
    query.limit = String(params.limit);
  }

  return query;
}

export const ordersService = {
  async create(payload: CreateOrderPayload): Promise<OrderDetail> {
    const { data } = await api.post<OrderDetail>('/orders', payload);
    return data;
  },

  async list(params: FindOrdersParams = {}): Promise<OrderListResult> {
    const { data } = await api.get<OrderListResult>('/orders', {
      params: buildOrdersQuery(params),
    });
    return data;
  },

  async getById(id: string): Promise<OrderDetail> {
    const { data } = await api.get<OrderDetail>(
      `/orders/${encodeURIComponent(id)}`,
    );
    return data;
  },

  async submitCredentials(
    id: string,
    payload: SubmitCredentialsPayload,
  ): Promise<OrderDetail> {
    const { data } = await api.patch<OrderDetail>(
      `/orders/${encodeURIComponent(id)}/credentials`,
      payload,
    );
    return data;
  },

  async confirm(id: string): Promise<OrderDetail> {
    const { data } = await api.patch<OrderDetail>(
      `/orders/${encodeURIComponent(id)}/confirm`,
    );
    return data;
  },
};
