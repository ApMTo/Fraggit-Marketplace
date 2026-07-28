import { CHAT_SYSTEM_EVENT } from '../constants/chat.constants';
import { buildOrderCreatedMetadata } from './system-message-metadata.util';

describe('buildOrderCreatedMetadata', () => {
  it('builds order_created metadata with order url', () => {
    const metadata = buildOrderCreatedMetadata({
      orderId: 'order-1',
      orderNumber: 'FRG-100',
      listingId: 'listing-1',
      listingTitle: 'Rare skin',
      frontendUrl: 'https://fraggit.test',
    });

    expect(metadata).toEqual({
      event: CHAT_SYSTEM_EVENT.ORDER_CREATED,
      orderId: 'order-1',
      orderNumber: 'FRG-100',
      listingId: 'listing-1',
      listingTitle: 'Rare skin',
      url: 'https://fraggit.test/orders/order-1',
      messageKey: 'system.orderCreated',
    });
  });
});
