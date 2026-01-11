/**
 * Unit tests for add command
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
    addItem: jest.fn(),
  },
}));

jest.mock('@/services/search.service', () => ({
  __esModule: true,
  default: {
    getTobaccoDetails: jest.fn(),
  },
}));

// Import after mocking
import { addCommand } from '@/bot/commands/add';
import bot from '@/bot/bot';
import wishlistService from '@/services/wishlist.service';
import searchService from '@/services/search.service';

describe('addCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command registration', () => {
    it('should register the /add command handler', () => {
      // Execute command registration
      addCommand();

      // Verify onText was called with the correct regex
      expect(bot.onText).toHaveBeenCalledWith(
        /\/add(?:\s+(.+))?/,
        expect.any(Function)
      );
    });

    it('should register exactly one handler', () => {
      addCommand();
      expect(bot.onText).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling with valid tobacco ID', () => {
    it('should add tobacco to wishlist with valid ID', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      const mockTobacco = {
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
        flavor: 'Mint',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(mockTobacco);
      (wishlistService.addItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [{ tobaccoId: '1', addedAt: new Date().toISOString() }],
      });

      await handler(mockMessage, ['/add 1', '1']);

      expect(searchService.getTobaccoDetails).toHaveBeenCalledWith('1');
      expect(wishlistService.addItem).toHaveBeenCalledWith(123456789, '1');
      expect(bot.sendChatAction).toHaveBeenCalledWith(123456789, 'typing');
    });

    it('should send success message with tobacco details', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 2',
      };

      const mockTobacco = {
        id: '2',
        name: 'Double Apple',
        brand: 'Al Fakher',
        flavor: 'Apple',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(mockTobacco);
      (wishlistService.addItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [{ tobaccoId: '2', addedAt: new Date().toISOString() }],
      });

      await handler(mockMessage, ['/add 2', '2']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.any(String),
        expect.any(Object)
      );
      
      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];
      expect(sentMessage).toContain('✅');
      expect(sentMessage).toContain('Al Fakher - Double Apple');
      expect(sentMessage).toContain('ID: 2');
      expect(sentMessage).toContain('Flavor: Apple');
    });

    it('should log the add command', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 3',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue({
        id: '3',
        name: 'Blueberry',
        brand: 'Starbuzz',
      });

      (wishlistService.addItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [{ tobaccoId: '3', addedAt: new Date().toISOString() }],
      });

      await handler(mockMessage, ['/add 3', '3']);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/add command received from user 123456789')
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('tobacco: 3')
      );
    });
  });

  describe('message handling with missing tobacco ID', () => {
    it('should send error message when tobacco ID is missing', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add',
      };

      await handler(mockMessage, ['/add', undefined]);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Please provide a tobacco ID')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/add <tobacco_id>')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Example: /add 12345')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/search to find tobacco IDs')
      );
    });

    it('should not call services when tobacco ID is missing', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add',
      };

      await handler(mockMessage, ['/add', undefined]);

      expect(searchService.getTobaccoDetails).not.toHaveBeenCalled();
      expect(wishlistService.addItem).not.toHaveBeenCalled();
    });
  });

  describe('message handling with invalid tobacco ID', () => {
    it('should send error message when tobacco is not found', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 999',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(null);

      await handler(mockMessage, ['/add 999', '999']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Tobacco with ID "999" not found')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/search to find valid tobacco IDs')
      );
    });

    it('should not call wishlist service when tobacco is not found', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 999',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(null);

      await handler(mockMessage, ['/add 999', '999']);

      expect(wishlistService.addItem).not.toHaveBeenCalled();
    });
  });

  describe('message handling with duplicate tobacco', () => {
    it('should send error message when tobacco is already in wishlist', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      const mockTobacco = {
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(mockTobacco);
      (wishlistService.addItem as jest.Mock).mockRejectedValue(
        new Error('Tobacco already in wishlist')
      );

      await handler(mockMessage, ['/add 1', '1']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('This tobacco is already in your wishlist')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/wishlist to view your wishlist')
      );
    });
  });

  describe('message handling with missing user ID', () => {
    it('should send error message when user ID is missing', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      await handler(mockMessage, ['/add 1', '1']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Unable to identify user')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Please try again')
      );
    });

    it('should not call services when user ID is missing', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      await handler(mockMessage, ['/add 1', '1']);

      expect(searchService.getTobaccoDetails).not.toHaveBeenCalled();
      expect(wishlistService.addItem).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle search service errors gracefully', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockRejectedValue(
        new Error('Search service failed')
      );

      await handler(mockMessage, ['/add 1', '1']);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in add command:',
        expect.any(Error)
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Sorry, an error occurred while adding to wishlist')
      );
    });

    it('should handle wishlist service errors gracefully', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      const mockTobacco = {
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(mockTobacco);
      (wishlistService.addItem as jest.Mock).mockRejectedValue(
        new Error('Wishlist service failed')
      );

      await handler(mockMessage, ['/add 1', '1']);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in add command:',
        expect.any(Error)
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Sorry, an error occurred while adding to wishlist')
      );
    });

    it('should handle sendMessage errors gracefully', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      const mockTobacco = {
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue(mockTobacco);
      (wishlistService.addItem as jest.Mock).mockResolvedValue({
        userId: 123456789,
        items: [{ tobaccoId: '1', addedAt: new Date().toISOString() }],
      });

      (bot.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      await expect(handler(mockMessage, ['/add 1', '1'])).resolves.not.toThrow();
    });
  });

  describe('message properties', () => {
    it('should extract chat ID from message', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 999888777 },
        chat: { id: 999888777, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
      });

      (wishlistService.addItem as jest.Mock).mockResolvedValue({
        userId: 999888777,
        items: [{ tobaccoId: '1', addedAt: new Date().toISOString() }],
      });

      await handler(mockMessage, ['/add 1', '1']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        999888777,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should extract user ID from message', async () => {
      addCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 555444333 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/add 1',
      };

      (searchService.getTobaccoDetails as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Mint',
        brand: 'Al Fakher',
      });

      (wishlistService.addItem as jest.Mock).mockResolvedValue({
        userId: 555444333,
        items: [{ tobaccoId: '1', addedAt: new Date().toISOString() }],
      });

      await handler(mockMessage, ['/add 1', '1']);

      expect(wishlistService.addItem).toHaveBeenCalledWith(555444333, '1');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user 555444333')
      );
    });
  });
});
