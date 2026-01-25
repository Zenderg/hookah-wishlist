import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WishlistItem]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
