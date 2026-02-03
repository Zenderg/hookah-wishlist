import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { WishlistHandler } from './handlers/wishlist.handler';
import { UrlHandler } from './handlers/url.handler';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf<Context>;

  constructor(
    private startHandler: StartHandler,
    private helpHandler: HelpHandler,
    private wishlistHandler: WishlistHandler,
    private urlHandler: UrlHandler,
  ) {
    this.bot = new Telegraf<Context>(process.env.TELEGRAM_BOT_TOKEN || '');
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.command('start', async (ctx) => {
      this.logger.log(`Start command received from user ${ctx.from?.id}`);
      await this.startHandler.handle(ctx);
    });

    this.bot.command('help', async (ctx) => {
      this.logger.log(`Help command received from user ${ctx.from?.id}`);
      await this.helpHandler.handle(ctx);
    });

    this.bot.command('wishlist', async (ctx) => {
      this.logger.log(`Wishlist command received from user ${ctx.from?.id}`);
      await this.wishlistHandler.handle(ctx);
    });

    // Handle text messages (URLs)
    this.bot.on('text', async (ctx) => {
      const text = ctx.message?.text;
      if (text && this.urlHandler.canHandle(text)) {
        this.logger.log(`URL received from user ${ctx.from?.id}: ${text}`);
        await this.urlHandler.handle(ctx);
      }
    });
  }

  async handleUpdate(update: any): Promise<void> {
    try {
      await this.bot.handleUpdate(update);
    } catch (error) {
      this.logger.error('Error handling update:', error);
      throw error;
    }
  }

  getBot(): Telegraf<Context> {
    return this.bot;
  }

  async launch(): Promise<void> {
    this.logger.log('Launching Telegram bot with polling...');
    await this.bot.launch();
    this.logger.log('Telegram bot is running and listening for updates');
  }

  async stop(): Promise<void> {
    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop();
    this.logger.log('Telegram bot stopped');
  }
}
