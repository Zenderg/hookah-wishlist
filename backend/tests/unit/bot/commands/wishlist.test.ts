/**
 * Unit tests for wishlist command
 */

import logger from '@/utils/logger';

// Mock dependencies - must be done before importing the command
jest.mock('@/bot/bot', () => {
  const mockBot = {
    sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
    sendPhoto: jest.fn().mockResolvedValue({ message_id: 1 }),
    sendChatAction: jest.fn().mockResolvedValue(true),
    answerCallbackQuery: jest.fn().mockResolvedValue(true),
    editMessageText: jest.fn().mockResolvedValue({ message_id: 1 }),
    editMessageReplyMarkup: jest.fn().mockResolvedValue({ message_id: 1 }),
    onText: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockBot,
    bot: mockBot,
  };
});

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/services/wishlist.service', () => ({
  __esModule: true,
  default: {
    getWishlistWithDetails: jest.fn(),
    formatWishlist: jest.fn(),
  },
}));

// Import after mocking
import { wishlistCommand } from '@/bot/commands/wishlist';
import bot from '@/bot/bot';
import wishlistService from '@/services/wishlist.service';

describe('wishlistCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command registration', () => {
    it('should register the /wishlist command handler', () => {
      // Execute command registration
      wishlistCommand();

      // Verify onText was called with the correct regex
      expect(bot.onText).toHaveBeenCalledWith(
        /\/wishlist/,
        expect.any(Function)
      );
    });

    it('should register exactly one handler', () => {
      wishlistCommand();
      expect(bot.onText).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling with valid wishlist', () => {
    it('should display user wishlist when it exists', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      const mockWishlist = {
        userId: 123456789,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-05T10:00:00.000Z',
            tobacco: {
              id: '1',
              name: 'Mint',
              brand: 'Al Fakher',
              flavor: 'Mint',
            },
          },
        ],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue(
        mockWishlist
      );

      (wishlistService.formatWishlist as jest.Mock).mockReturnValue(
        '📋 Your Wishlist (1 items)\n\n1. Al Fakher - Mint\n   🏷️ ID: 1\n   🍃 Flavor: Mint\n   ➕ Added: 1/5/2024\n\nUse /remove <tobacco_id> to remove items from your wishlist'
      );

      await handler(mockMessage);

      expect(wishlistService.getWishlistWithDetails).toHaveBeenCalledWith(123456789);
      expect(bot.sendChatAction).toHaveBeenCalledWith(123456789, 'typing');
    });

    it('should send formatted wishlist message', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      const mockWishlist = {
        userId: 123456789,
        items: [
          {
            tobaccoId: '1',
            addedAt: '2024-01-05T10:00:00.000Z',
            tobacco: {
              id: '1',
              name: 'Mint',
              brand: 'Al Fakher',
              flavor: 'Mint',
            },
          },
        ],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue(
        mockWishlist
      );

      const formattedMessage = '📋 Your Wishlist (1 items)\n\n1. Al Fakher - Mint\n   🏷️ ID: 1\n   🍃 Flavor: Mint\n   ➕ Added: 1/5/2024\n\nUse /remove <tobacco_id> to remove items from your wishlist';
      (wishlistService.formatWishlist as jest.Mock).mockReturnValue(formattedMessage);

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        formattedMessage,
        { parse_mode: 'HTML' }
      );
    });

    it('should log the wishlist command', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      (wishlistService.formatWishlist as jest.Mock).mockReturnValue(
        '📋 Your Wishlist (0 items)\n\nUse /remove <tobacco_id> to remove items from your wishlist'
      );

      await handler(mockMessage);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/wishlist command received from user 123456789')
      );
    });
  });

  describe('message handling with empty wishlist', () => {
    it('should send empty wishlist message when wishlist is null', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue(null);

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Your wishlist is empty')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/search to find tobaccos')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/add to add them to your wishlist')
      );
    });

    it('should not call formatWishlist when wishlist is null', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue(null);

      await handler(mockMessage);

      expect(wishlistService.formatWishlist).not.toHaveBeenCalled();
    });
  });

  describe('message handling with missing user ID', () => {
    it('should send error message when user ID is missing', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Unable to identify user')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Please try again')
      );
    });

    it('should not call wishlist service when user ID is missing', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      await handler(mockMessage);

      expect(wishlistService.getWishlistWithDetails).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle wishlist service errors gracefully', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockRejectedValue(
        new Error('Wishlist service failed')
      );

      await handler(mockMessage);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in wishlist command:',
        expect.any(Error)
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Sorry, an error occurred while retrieving your wishlist')
      );
    });

    it('should handle sendMessage errors gracefully', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      (wishlistService.formatWishlist as jest.Mock).mockReturnValue(
        '📋 Your Wishlist (0 items)\n\nUse /remove <tobacco_id> to remove items from your wishlist'
      );

      (bot.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      await expect(handler(mockMessage)).resolves.not.toThrow();
    });
  });

  describe('message properties', () => {
    it('should extract chat ID from message', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 999888777 },
        chat: { id: 999888777, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue({
        userId: 999888777,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      (wishlistService.formatWishlist as jest.Mock).mockReturnValue(
        '📋 Your Wishlist (0 items)\n\nUse /remove <tobacco_id> to remove items from your wishlist'
      );

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        999888777,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should extract user ID from message', async () => {
      wishlistCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 555444333 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/wishlist',
      };

      (wishlistService.getWishlistWithDetails as jest.Mock).mockResolvedValue({
        userId: 555444333,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      (wishlistService.formatWishlist as jest.Mock).mockReturnValue(
        '📋 Your Wishlist (0 items)\n\nUse /remove <tobacco_id> to remove items from your wishlist'
      );

      await handler(mockMessage);

      expect(wishlistService.getWishlistWithDetails).toHaveBeenCalledWith(555444333);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user 555444333')
      );
    });
  });
});
