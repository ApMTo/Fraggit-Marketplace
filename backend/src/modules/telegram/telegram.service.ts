import {
  forwardRef,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import {
  TELEGRAM_LINK_CODE_KEY_PREFIX,
  type TelegramLocale,
  isTelegramLocale,
} from './constants/telegram.constants';
import {
  formatNotificationMessage,
  normalizeTelegramLocale,
  tBot,
  tNotification,
} from './telegram-i18n';
import { TelegramBotService } from './telegram-bot.service';

export type TelegramLinkStatus = {
  linked: boolean;
  telegramUsername: string | null;
  telegramLocale: TelegramLocale | null;
};

export type TelegramLinkCodeResult = {
  deepLink: string;
  expiresInSeconds: number;
};

@Injectable()
export class TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TelegramBotService))
    private readonly bot: TelegramBotService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramService.name);
  }

  async getStatus(userId: string): Promise<TelegramLinkStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        telegramId: true,
        telegramUsername: true,
        telegramLocale: true,
      },
    });

    if (!user?.telegramId) {
      return {
        linked: false,
        telegramUsername: null,
        telegramLocale: null,
      };
    }

    return {
      linked: true,
      telegramUsername: user.telegramUsername,
      telegramLocale: normalizeTelegramLocale(user.telegramLocale),
    };
  }

  async createLinkCode(userId: string): Promise<TelegramLinkCodeResult> {
    if (!this.bot.isReady()) {
      throw new ServiceUnavailableException('telegram_bot_unavailable');
    }

    const ttl = this.configService.get<number>(
      'telegram.linkCodeTtlSeconds',
      600,
    );
    const code = randomBytes(16).toString('hex');
    const key = `${TELEGRAM_LINK_CODE_KEY_PREFIX}${code}`;

    await this.redis.set(key, userId, ttl);

    const username = this.bot.getBotUsername();
    if (!username) {
      throw new ServiceUnavailableException('telegram_bot_unavailable');
    }

    return {
      deepLink: `https://t.me/${username}?start=${code}`,
      expiresInSeconds: ttl,
    };
  }

  async unlink(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramLocale: null,
      },
    });
  }

  async consumeLinkCode(code: string): Promise<string | null> {
    const key = `${TELEGRAM_LINK_CODE_KEY_PREFIX}${code}`;
    const userId = await this.redis.get(key);

    if (!userId) {
      return null;
    }

    await this.redis.del(key);
    return userId;
  }

  async linkTelegramAccount(params: {
    userId: string;
    telegramId: string;
    telegramUsername: string | null;
  }): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: {
        telegramId: params.telegramId,
        NOT: { id: params.userId },
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          telegramId: null,
          telegramUsername: null,
          telegramLocale: null,
        },
      });
    }

    await this.prisma.user.update({
      where: { id: params.userId },
      data: {
        telegramId: params.telegramId,
        telegramUsername: params.telegramUsername,
      },
    });
  }

  async setLocaleByTelegramId(
    telegramId: string,
    locale: string,
  ): Promise<boolean> {
    if (!isTelegramLocale(locale)) {
      return false;
    }

    const result = await this.prisma.user.updateMany({
      where: { telegramId },
      data: { telegramLocale: locale },
    });

    return result.count > 0;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        telegramLocale: true,
      },
    });
  }

  async getLinkedDelivery(
    userId: string,
  ): Promise<{ telegramId: string; locale: TelegramLocale } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, telegramLocale: true },
    });

    if (!user?.telegramId) {
      return null;
    }

    return {
      telegramId: user.telegramId,
      locale: normalizeTelegramLocale(user.telegramLocale),
    };
  }

  async tryNotifyUser(
    userId: string,
    text: string,
    action?: { href: string; label: string },
  ): Promise<boolean> {
    const delivery = await this.getLinkedDelivery(userId);
    if (!delivery) {
      return false;
    }

    return this.sendToDelivery(userId, delivery, text, action);
  }

  private async sendToDelivery(
    userId: string,
    delivery: { telegramId: string; locale: TelegramLocale },
    text: string,
    action?: { href: string; label: string },
  ): Promise<boolean> {
    if (!this.bot.isReady()) {
      return false;
    }

    try {
      await this.bot.sendMessage(delivery.telegramId, text, action);
      return true;
    } catch (error) {
      this.logger.warn(
        {
          userId,
          telegramId: delivery.telegramId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to send Telegram notification',
      );
      return false;
    }
  }

  async tryNotifyOfflineChat(params: {
    recipientUserId: string;
    senderDisplayName: string;
    conversationId: string;
    messagePreview: string;
  }): Promise<boolean> {
    const delivery = await this.getLinkedDelivery(params.recipientUserId);
    if (!delivery) {
      return false;
    }

    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );
    const href = `${frontendUrl}/chat/${params.conversationId}`;
    const text = tNotification(
      delivery.locale,
      'chat_message',
      {
        sender: params.senderDisplayName,
        preview: params.messagePreview || '…',
        href,
      },
      'openChat',
    );

    return this.sendToDelivery(params.recipientUserId, delivery, text, {
      href,
      label: tBot(delivery.locale, 'openChat'),
    });
  }

  async tryNotifyOfflineOrder(params: {
    recipientUserId: string;
    titleKey: string;
    bodyKey?: string | null;
    notificationParams: Record<string, string | number | undefined | null>;
    href: string;
  }): Promise<boolean> {
    const delivery = await this.getLinkedDelivery(params.recipientUserId);
    if (!delivery) {
      return false;
    }

    const text = formatNotificationMessage(
      delivery.locale,
      params.titleKey,
      params.bodyKey,
      params.notificationParams,
      params.href,
      'openOrder',
    );

    return this.sendToDelivery(params.recipientUserId, delivery, text, {
      href: params.href,
      label: tBot(delivery.locale, 'openOrder'),
    });
  }

  async notifyLotCreated(params: {
    sellerId: string;
    lotId: string;
    title: string;
    categorySlug: string;
    subcategorySlug: string;
  }): Promise<void> {
    await this.notifyLotEvent({
      ...params,
      templateKey: 'lot_created',
    });
  }

  async notifyLotStatusChanged(params: {
    sellerId: string;
    lotId: string;
    title: string;
    categorySlug: string;
    subcategorySlug: string;
    status: 'REMOVED' | 'UNDER_REVIEW' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
  }): Promise<void> {
    const templateKeyByStatus: Record<typeof params.status, string> = {
      REMOVED: 'lot_removed',
      UNDER_REVIEW: 'lot_under_review',
      OPEN: 'lot_restored',
      CLOSED: 'lot_closed',
      ARCHIVED: 'lot_archived',
    };

    await this.notifyLotEvent({
      sellerId: params.sellerId,
      lotId: params.lotId,
      title: params.title,
      categorySlug: params.categorySlug,
      subcategorySlug: params.subcategorySlug,
      templateKey: templateKeyByStatus[params.status],
    });
  }

  private async notifyLotEvent(params: {
    sellerId: string;
    lotId: string;
    title: string;
    categorySlug: string;
    subcategorySlug: string;
    templateKey: string;
  }): Promise<void> {
    const delivery = await this.getLinkedDelivery(params.sellerId);
    if (!delivery) {
      return;
    }

    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );
    const href = `${frontendUrl}/listings/${params.categorySlug}/${params.subcategorySlug}/lot/${params.lotId}`;
    const text = tNotification(
      delivery.locale,
      params.templateKey,
      {
        title: params.title,
        href,
      },
      'openLot',
    );

    await this.sendToDelivery(params.sellerId, delivery, text, {
      href,
      label: tBot(delivery.locale, 'openLot'),
    });
  }
}
