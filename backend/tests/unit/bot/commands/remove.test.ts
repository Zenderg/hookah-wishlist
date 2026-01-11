/**
 * Unit tests for remove command
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
    removeItem: jest.fn(),
  },
}));

// Import after mocking
import { removeCommand } from '@/bot/commands/remove';
import bot from '@/bot/bot';
import wishlistService from '@/services/wishlist.service';

describe('removeCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command registration', () => {
    it('should register the /remove command handler', () => {
      // Execute command registration
      removeCommand();

      // Verify onText was called with the correct regex
      expect(bot.onText).toHaveBeenCalledWith(
        /\/remove(?:\s+(.+))?/,
        expect.any(Function)
      );
    });

    it('should register exactly one handler', () => {
      removeCommand();
      expect(bot.onText).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling with valid tobacco ID', () => {
    it('should remove tobacco from wishlist with valid ID', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      (wishlistService.removeItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      await handler(mockMessage, ['/remove 1', '1']);

      expect(wishlistService.removeItem).toHaveBeenCalledWith(123456789, '1');
      expect(bot.sendChatAction).toHaveBeenCalledWith(123456789, 'typing');
    });

    it('should send success message after removing tobacco', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 2',
      };

      (wishlistService.removeItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      await handler(mockMessage, ['/remove 2', '2']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.any(String),
        expect.any(Object)
      );
      
      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];
      expect(sentMessage).toContain('✅');
      expect(sentMessage).toContain('Removed tobacco ID: 2');
      expect(sentMessage).toContain('/wishlist to view your updated wishlist');
    });

    it('should log the remove command', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 3',
      };

      (wishlistService.removeItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      await handler(mockMessage, ['/remove 3', '3']);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/remove command received from user 123456789')
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('tobacco: 3')
      );
    });
  });

  describe('message handling with missing tobacco ID', () => {
    it('should send error message when tobacco ID is missing', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove',
      };

      await handler(mockMessage, ['/remove', undefined]);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Please provide a tobacco ID')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/remove <tobacco_id>')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Example: /remove 12345')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/wishlist to see tobacco IDs in your wishlist')
      );
    });

    it('should not call wishlist service when tobacco ID is missing', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove',
      };

      await handler(mockMessage, ['/remove', undefined]);

      expect(wishlistService.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('message handling with empty wishlist', () => {
    it('should send error message when wishlist is not found', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      (wishlistService.removeItem as jest.Mock).mockRejectedValue(
        new Error('Wishlist not found')
      );

      await handler(mockMessage, ['/remove 1', '1']);

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
  });

  describe('message handling with tobacco not in wishlist', () => {
    it('should send error message when tobacco is not in wishlist', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 999',
      };

      (wishlistService.removeItem as jest.Mock).mockRejectedValue(
        new Error('Tobacco not found in wishlist')
      );

      await handler(mockMessage, ['/remove 999', '999']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Tobacco with ID "999" not found in your wishlist')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/wishlist to see tobacco IDs in your wishlist')
      );
    });
  });

  describe('message handling with missing user ID', () => {
    it('should send error message when user ID is missing', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      await handler(mockMessage, ['/remove 1', '1']);

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
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      await handler(mockMessage, ['/remove 1', '1']);

      expect(wishlistService.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle wishlist service errors gracefully', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      (wishlistService.removeItem as jest.Mock).mockRejectedValue(
        new Error('Wishlist service failed')
      );

      await handler(mockMessage, ['/remove 1', '1']);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in remove command:',
        expect.any(Error)
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Sorry, an error occurred while removing from wishlist')
      );
    });

    it('should handle sendMessage errors gracefully', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      (wishlistService.removeItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      (bot.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      await expect(handler(mockMessage, ['/remove 1', '1'])).resolves.not.toThrow();
    });
  });

  describe('message properties', () => {
    it('should extract chat ID from message', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 999888777 },
        chat: { id: 999888777, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      (wishlistService.removeItem as jest.Mock).mockResolvedValue({
        userId: 999888777,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      await handler(mockMessage, ['/remove 1', '1']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        999888777,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should extract user ID from message', async () => {
      removeCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 555444333 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/remove 1',
      };

      (wishlistService.removeItem as jest.Mock).mockResolvedValue({
        userId: 555444333,
        items: [],
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      });

      await handler(mockMessage, ['/remove 1', '1']);

      expect(wishlistService.removeItem).toHaveBeenCalledWith(555444333, '1');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user 555444333')
      );
    });
  });
});
