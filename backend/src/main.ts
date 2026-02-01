import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { BotService } from './bot/bot.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS for Telegram Mini Apps and local development
  const corsOrigin = process.env.CORS_ORIGIN || 'https://t.me';
  app.enableCors({
    origin: corsOrigin.includes(',') 
      ? corsOrigin.split(',').map(origin => origin.trim())
      : corsOrigin,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);

  // Launch Telegram bot with polling
  const botService = app.get(BotService);
  await botService.launch();
}
bootstrap();
