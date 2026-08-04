import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup, Telegraf } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { tBot } from './telegram-i18n';
import { TelegramService } from './telegram.service';

function normalizeBotUsername(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/^@/, '').trim();
  if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf | null = null;
  private botUsername: string | null = null;
  private launching = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramBotService.name);
  }

  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('telegram.botToken', '');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set — Telegram bot disabled');
      return;
    }

    this.bot = new Telegraf(token);
    this.registerHandlers(this.bot);

    const configuredUsername = normalizeBotUsername(
      this.configService.get<string>('telegram.botUsername', ''),
    );

    try {
      const me = await this.bot.telegram.getMe();
      this.botUsername =
        normalizeBotUsername(me.username) || configuredUsername;

      if (!this.botUsername) {
        this.bot = null;
        this.logger.error(
          'Telegram bot has no valid username — set TELEGRAM_BOT_USERNAME=fraggitbot',
        );
        return;
      }

      this.launching = true;
      void this.bot.launch().then(
        () => {
          this.logger.info(
            { username: this.botUsername },
            'Telegram bot started (long polling)',
          );
        },
        (error: Error) => {
          this.launching = false;
          this.logger.error(
            { error: error.message },
            'Telegram bot failed to start',
          );
        },
      );
    } catch (error) {
      this.bot = null;
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'Telegram bot init failed',
      );
    }
  }

  onModuleDestroy(): void {
    if (this.bot && this.launching) {
      this.bot.stop('NestJS shutdown');
      this.launching = false;
    }
  }

  isReady(): boolean {
    return this.bot !== null && this.botUsername !== null;
  }

  getBotUsername(): string | null {
    return this.botUsername;
  }

  async sendMessage(
    telegramId: string,
    text: string,
    action?: { href: string; label: string },
  ): Promise<void> {
    if (!this.bot) {
      throw new Error('telegram_bot_unavailable');
    }

    const buttonAction =
      action && isPublicHttpUrl(action.href) ? action : undefined;

    await this.bot.telegram.sendMessage(telegramId, text, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...(buttonAction
        ? {
            reply_markup: Markup.inlineKeyboard([
              Markup.button.url(buttonAction.label, buttonAction.href),
            ]).reply_markup,
          }
        : {}),
    });
  }

  private registerHandlers(bot: Telegraf): void {
    bot.start(async (ctx) => {
      const telegramId = String(ctx.from.id);
      const username = ctx.from.username ?? null;
      const payload = ctx.startPayload?.trim() || '';

      const existing = await this.telegramService.findByTelegramId(telegramId);
      if (existing && !payload) {
        const locale = existing.telegramLocale;
        await ctx.reply(tBot(locale, 'alreadyLinked'), { parse_mode: 'HTML' });
        await ctx.reply(tBot(locale, 'help'), {
          parse_mode: 'HTML',
          ...this.languageKeyboard(locale),
        });
        return;
      }

      if (!payload) {
        await ctx.reply(tBot('en', 'linkMissing'), { parse_mode: 'HTML' });
        return;
      }

      const userId = await this.telegramService.consumeLinkCode(payload);
      if (!userId) {
        await ctx.reply(tBot('en', 'linkInvalid'), { parse_mode: 'HTML' });
        return;
      }

      await this.telegramService.linkTelegramAccount({
        userId,
        telegramId,
        telegramUsername: username,
      });

      await ctx.reply(tBot('en', 'linkSuccess'), { parse_mode: 'HTML' });
      await ctx.reply(tBot('en', 'chooseLanguage'), {
        parse_mode: 'HTML',
        ...this.languageKeyboard('en'),
      });
    });

    bot.command('language', async (ctx) => {
      const telegramId = String(ctx.from.id);
      const user = await this.telegramService.findByTelegramId(telegramId);

      if (!user) {
        await ctx.reply(tBot('en', 'notLinked'), { parse_mode: 'HTML' });
        return;
      }

      await ctx.reply(tBot(user.telegramLocale, 'chooseLanguage'), {
        parse_mode: 'HTML',
        ...this.languageKeyboard(user.telegramLocale),
      });
    });

    bot.command('unlink', async (ctx) => {
      const telegramId = String(ctx.from.id);
      const user = await this.telegramService.findByTelegramId(telegramId);

      if (!user) {
        await ctx.reply(tBot('en', 'notLinked'), { parse_mode: 'HTML' });
        return;
      }

      await this.telegramService.unlink(user.id);
      await ctx.reply(tBot(user.telegramLocale, 'unlinked'), {
        parse_mode: 'HTML',
      });
    });

    bot.command('help', async (ctx) => {
      const telegramId = String(ctx.from.id);
      const user = await this.telegramService.findByTelegramId(telegramId);
      await ctx.reply(tBot(user?.telegramLocale, 'help'), {
        parse_mode: 'HTML',
      });
    });

    bot.action(/^lang:(en|ru)$/, async (ctx) => {
      const locale = ctx.match[1];
      const telegramId = String(ctx.from.id);
      const updated = await this.telegramService.setLocaleByTelegramId(
        telegramId,
        locale,
      );

      if (!updated) {
        await ctx.answerCbQuery();
        await ctx.reply(tBot('en', 'notLinked'), { parse_mode: 'HTML' });
        return;
      }

      await ctx.answerCbQuery();
      await ctx.editMessageText(tBot(locale, 'languageSaved'), {
        parse_mode: 'HTML',
      });
    });

    bot.catch((error: unknown) => {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Telegram bot handler error',
      );
    });
  }

  private languageKeyboard(locale: string | null | undefined) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(tBot(locale, 'languageEn'), 'lang:en'),
        Markup.button.callback(tBot(locale, 'languageRu'), 'lang:ru'),
      ],
    ]);
  }
}
