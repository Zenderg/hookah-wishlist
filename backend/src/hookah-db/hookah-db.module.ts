import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HookahDbController } from './hookah-db.controller';
import { HookahDbService } from './hookah-db.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: 10000,
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HookahDbController],
  providers: [HookahDbService],
  exports: [HookahDbService],
})
export class HookahDbModule {}
