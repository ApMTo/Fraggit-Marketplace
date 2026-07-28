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
  reportStatus: {
    resolved: {
      title: 'items.reportStatus.resolved.title',
      body: 'items.reportStatus.resolved.body',
    },
    dismissed: {
      title: 'items.reportStatus.dismissed.title',
      body: 'items.reportStatus.dismissed.body',
    },
  },
  ticketResolved: {
    buyerFavor: {
      title: 'items.ticketResolved.buyerFavor.title',
      body: 'items.ticketResolved.buyerFavor.body',
    },
    sellerFavor: {
      title: 'items.ticketResolved.sellerFavor.title',
      body: 'items.ticketResolved.sellerFavor.body',
    },
    noAction: {
      title: 'items.ticketResolved.noAction.title',
      body: 'items.ticketResolved.noAction.body',
    },
  },
  ticketVerdictRequested: {
    title: 'items.ticketVerdictRequested.title',
    body: 'items.ticketVerdictRequested.body',
  },
  reportVerdictRequested: {
    title: 'items.reportVerdictRequested.title',
    body: 'items.reportVerdictRequested.body',
  },
  lotDisputeMessage: {
    title: 'items.lotDisputeMessage.title',
    body: 'items.lotDisputeMessage.body',
  },
} as const;

/** English templates for offline email (params: {orderNumber}, {listingTitle}, {orderPart}, {note}). */
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
  [NOTIFICATION_KEYS.reportStatus.resolved.title]: 'Report resolved',
  [NOTIFICATION_KEYS.reportStatus.resolved.body]:
    'Your report was reviewed and marked as resolved.{note}',
  [NOTIFICATION_KEYS.reportStatus.dismissed.title]: 'Report closed',
  [NOTIFICATION_KEYS.reportStatus.dismissed.body]:
    'Your report was reviewed and closed without action.{note}',
  [NOTIFICATION_KEYS.ticketResolved.buyerFavor.title]: 'Decision ready',
  [NOTIFICATION_KEYS.ticketResolved.buyerFavor.body]:
    'Moderation decided in favor of the buyer{orderPart}.{note}',
  [NOTIFICATION_KEYS.ticketResolved.sellerFavor.title]: 'Decision ready',
  [NOTIFICATION_KEYS.ticketResolved.sellerFavor.body]:
    'Moderation decided in favor of the seller{orderPart}.{note}',
  [NOTIFICATION_KEYS.ticketResolved.noAction.title]: 'Case closed',
  [NOTIFICATION_KEYS.ticketResolved.noAction.body]:
    'Moderation closed the case without changing the outcome{orderPart}.{note}',
  [NOTIFICATION_KEYS.ticketVerdictRequested.title]: 'Verdict needed',
  [NOTIFICATION_KEYS.ticketVerdictRequested.body]:
    'A moderator handed off ticket “{subject}” for your decision.{note}',
  [NOTIFICATION_KEYS.reportVerdictRequested.title]:
    'User report verdict needed',
  [NOTIFICATION_KEYS.reportVerdictRequested.body]:
    'Moderator summary on @{targetUsername} (reporter @{reporterUsername}).{note}',
  [NOTIFICATION_KEYS.lotDisputeMessage.title]: 'Lot dispute update',
  [NOTIFICATION_KEYS.lotDisputeMessage.body]:
    'New message in the mediation chat for {listingTitle}.{preview}',
};

export function resolveNotificationEmailText(
  key: string,
  params: Record<string, string | number | undefined | null> = {},
): string {
  const enriched = { ...params };
  if (enriched.orderNumber && !enriched.orderPart) {
    enriched.orderPart = ` for order #${enriched.orderNumber}`;
  }
  if (enriched.note && String(enriched.note).trim()) {
    enriched.note = ` Note: ${String(enriched.note).trim()}`;
  } else {
    enriched.note = '';
  }
  if (!enriched.orderPart) {
    enriched.orderPart = '';
  }

  const template = EMAIL_EN[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = enriched[name];
    return value == null ? '' : String(value);
  });
}
