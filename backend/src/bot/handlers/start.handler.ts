import { Injectable } from '@nestjs/common';

@Injectable()
export class StartHandler {
  async handle(ctx: any) {
    const welcomeMessage = `
🎉 Welcome to Hookah Wishlist!

This bot helps you discover and save hookah tobaccos you want to try.

📱 <b>Available Commands:</b>
/start - Show this welcome message
/help - Display usage instructions
/wishlist - View your saved tobaccos

🔗 <b>Mini-App:</b>
Click the button below to open the web app and discover tobaccos!
    `;

    const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL || 'https://t.me/your_bot/your_app';

    await ctx.reply(welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔍 Open Mini-App',
              url: miniAppUrl,
            },
          ],
        ],
      },
    });
  }
}
