import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { WishlistHandler } from './handlers/wishlist.handler';

@Module({
  providers: [BotService, StartHandler, HelpHandler, WishlistHandler],
  exports: [BotService],
})
export class BotModule {}
