/**
 * i18n keys stored in Notification.title / Notification.body.
 * Frontend resolves them under `notifications.*` via next-intl.
 * Email offline delivery resolves English copy from the same keys.
 */
export const NOTIFICATION_KEYS = {
  orderCreated: {
    seller: {
      title: 'items.orderCreated.seller.title',
      body: 'items.orderCreated.seller.body',
    },
    buyer: {
      title: 'items.orderCreated.buyer.title',
      body: 'items.orderCreated.buyer.body',
    },
  },
  orderCredentials: {
    buyer: {
      title: 'items.orderCredentials.buyer.title',
      body: 'items.orderCredentials.buyer.body',
    },
  },
  orderServiceCompleted: {
    buyer: {
      title: 'items.orderServiceCompleted.buyer.title',
      body: 'items.orderServiceCompleted.buyer.body',
    },
  },
  orderApproved: {
    seller: {
      title: 'items.orderApproved.seller.title',
      body: 'items.orderApproved.seller.body',
    },
    buyer: {
      title: 'items.orderApproved.buyer.title',
      body: 'items.orderApproved.buyer.body',
    },
  },
} as const;

/** English templates for offline email (params: {orderNumber}, {listingTitle}). */
const EMAIL_EN: Record<string, string> = {
  [NOTIFICATION_KEYS.orderCreated.seller.title]: 'New order',
  [NOTIFICATION_KEYS.orderCreated.seller.body]:
    'A buyer placed order #{orderNumber} ({listingTitle}).',
  [NOTIFICATION_KEYS.orderCreated.buyer.title]: 'Order placed',
  [NOTIFICATION_KEYS.orderCreated.buyer.body]:
    'Order #{orderNumber} was created successfully.',
  [NOTIFICATION_KEYS.orderCredentials.buyer.title]: 'Order delivery data',
  [NOTIFICATION_KEYS.orderCredentials.buyer.body]:
    'The seller sent delivery data for order #{orderNumber}.',
  [NOTIFICATION_KEYS.orderServiceCompleted.buyer.title]: 'Service completed',
  [NOTIFICATION_KEYS.orderServiceCompleted.buyer.body]:
    'The seller marked the service for order #{orderNumber} as completed.',
  [NOTIFICATION_KEYS.orderApproved.seller.title]: 'Order completed',
  [NOTIFICATION_KEYS.orderApproved.seller.body]:
    'Order #{orderNumber} was confirmed by the buyer.',
  [NOTIFICATION_KEYS.orderApproved.buyer.title]: 'Order completed',
  [NOTIFICATION_KEYS.orderApproved.buyer.body]:
    'Order #{orderNumber} was completed successfully.',
};

export function resolveNotificationEmailText(
  key: string,
  params: Record<string, string | number | undefined | null> = {},
): string {
  const template = EMAIL_EN[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value == null ? '' : String(value);
  });
}
