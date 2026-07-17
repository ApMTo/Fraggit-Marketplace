import { CHAT_SYSTEM_EVENT } from '../constants/chat.constants';

type OrderSystemBase = {
  orderId: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  url: string;
  title: string;
};

export type OrderCreatedMetadata = OrderSystemBase & {
  event: typeof CHAT_SYSTEM_EVENT.ORDER_CREATED;
};

export type OrderCredentialsMetadata = OrderSystemBase & {
  event: typeof CHAT_SYSTEM_EVENT.ORDER_CREDENTIALS;
};

export type OrderApprovedMetadata = OrderSystemBase & {
  event: typeof CHAT_SYSTEM_EVENT.ORDER_APPROVED;
};

export type OrderSystemMetadata =
  OrderCreatedMetadata | OrderCredentialsMetadata | OrderApprovedMetadata;

function buildOrderUrl(frontendUrl: string, orderId: string): string {
  return `${frontendUrl}/orders/${orderId}`;
}

export function buildOrderCreatedMetadata(params: {
  orderId: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  frontendUrl: string;
}): OrderCreatedMetadata {
  return {
    event: CHAT_SYSTEM_EVENT.ORDER_CREATED,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    url: buildOrderUrl(params.frontendUrl, params.orderId),
    title: 'Покупка успешно совершена',
  };
}

export function buildOrderCredentialsMetadata(params: {
  orderId: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  frontendUrl: string;
}): OrderCredentialsMetadata {
  return {
    event: CHAT_SYSTEM_EVENT.ORDER_CREDENTIALS,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    url: buildOrderUrl(params.frontendUrl, params.orderId),
    title: 'Продавец передал данные',
  };
}

export function buildOrderApprovedMetadata(params: {
  orderId: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  frontendUrl: string;
}): OrderApprovedMetadata {
  return {
    event: CHAT_SYSTEM_EVENT.ORDER_APPROVED,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    url: buildOrderUrl(params.frontendUrl, params.orderId),
    title: 'Заказ завершён',
  };
}
