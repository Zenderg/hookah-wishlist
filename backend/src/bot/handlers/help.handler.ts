import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpHandler {
  async handle(ctx: any) {
    const helpMessage = `
📖 <b>How to use Hookah Wishlist</b>

<b>1. Discover Tobaccos</b>
• Use the mini-app to search for tobaccos
• Filter by brand to find specific flavors
• View detailed information about each tobacco

<b>2. Save to Wishlist</b>
• Click the "Add" button on any tobacco
• Your wishlist is saved automatically

<b>3. View Your Wishlist</b>
• Use the /wishlist command to see all saved tobaccos
• Items are sorted by date added (newest first)

<b>4. Visit a Tobacco Shop</b>
• Open Telegram and send /wishlist
• Show your wishlist to the shop staff
• Purchase your desired tobaccos

💡 <b>Tips:</b>
• The mini-app works best in Telegram
• Your wishlist is linked to your Telegram account
• No registration required!

❓ <b>Need help?</b>
Contact support for assistance.
    `;

    await ctx.reply(helpMessage, {
      parse_mode: 'HTML',
    });
  }
}
