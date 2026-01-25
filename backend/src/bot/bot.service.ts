import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { WishlistHandler } from './handlers/wishlist.handler';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf<Context>;

  constructor(
    private startHandler: StartHandler,
    private helpHandler: HelpHandler,
    private wishlistHandler: WishlistHandler,
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
}
