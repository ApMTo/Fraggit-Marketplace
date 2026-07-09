import { CHAT_SYSTEM_EVENT } from '../constants/chat.constants';

export type OrderCreatedMetadata = {
  event: typeof CHAT_SYSTEM_EVENT.ORDER_CREATED;
  orderId: string;
  orderNumber: string;
  listingId: string;
  listingTitle: string;
  url: string;
  title: string;
};

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
    url: `${params.frontendUrl}/orders/${params.orderId}`,
    title: 'Покупка успешно совершена',
  };
}
