import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { WishlistHandler } from './handlers/wishlist.handler';
import { WishlistModule } from '../wishlist/wishlist.module';
import { HookahDbModule } from '../hookah-db/hookah-db.module';

@Module({
  imports: [WishlistModule, HookahDbModule],
  providers: [BotService, StartHandler, HelpHandler, WishlistHandler],
  exports: [BotService],
})
export class BotModule {}
