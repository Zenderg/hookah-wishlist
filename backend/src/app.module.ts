import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database/database.module';
import { HookahDbModule } from './hookah-db/hookah-db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        type: 'sqlite',
        database: configService.get('DATABASE_PATH') || './data/wishlist.db',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    WishlistModule,
    BotModule,
    DatabaseModule,
    HookahDbModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
