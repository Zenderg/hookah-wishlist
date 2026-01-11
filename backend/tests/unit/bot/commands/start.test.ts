/**
 * Unit tests for start command
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

// Import after mocking
import { startCommand } from '@/bot/commands/start';
import bot from '@/bot/bot';

describe('startCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command registration', () => {
    it('should register the /start command handler', () => {
      // Execute command registration
      startCommand();

      // Verify onText was called with the correct regex
      expect(bot.onText).toHaveBeenCalledWith(
        /\/start/,
        expect.any(Function)
      );
    });

    it('should register exactly one handler', () => {
      startCommand();
      expect(bot.onText).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling', () => {
    it('should send welcome message when /start command is received', async () => {
      startCommand();

      // Get the registered handler
      const handler = (bot.onText as jest.Mock).mock.calls[0][1];

      // Create mock message
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789, username: 'testuser' },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      // Execute handler
      await handler(mockMessage);

      // Verify sendMessage was called
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Welcome to Hookah Wishlist Bot!')
      );
    });

    it('should log the command reception', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789, username: 'testuser' },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/start command received from user 123456789')
      );
    });

    it('should handle messages without user information', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/start command received from user undefined')
      );
    });
  });

  describe('response formatting', () => {
    it('should include all available commands in the welcome message', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify all commands are mentioned
      expect(sentMessage).toContain('/start');
      expect(sentMessage).toContain('/help');
      expect(sentMessage).toContain('/search');
      expect(sentMessage).toContain('/wishlist');
      expect(sentMessage).toContain('/add');
      expect(sentMessage).toContain('/remove');
    });

    it('should include command descriptions', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify command descriptions are present
      expect(sentMessage).toContain('Show this welcome message');
      expect(sentMessage).toContain('Show all available commands');
      expect(sentMessage).toContain('Search for tobaccos');
      expect(sentMessage).toContain('View your wishlist');
      expect(sentMessage).toContain('Add tobacco to wishlist');
      expect(sentMessage).toContain('Remove from wishlist');
    });

    it('should include usage examples', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify usage examples are present
      expect(sentMessage).toContain('/search <query>');
      expect(sentMessage).toContain('/add <tobacco_id>');
      expect(sentMessage).toContain('/remove <tobacco_id>');
    });

    it('should include mini-app tip', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      expect(sentMessage).toContain('mini-app');
      expect(sentMessage).toContain('better experience');
    });

    it('should use emojis in the welcome message', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify emojis are used
      expect(sentMessage).toContain('🎉');
      expect(sentMessage).toContain('📋');
      expect(sentMessage).toContain('💡');
    });

    it('should include bot purpose description', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      expect(sentMessage).toContain('hookah tobacco wishlist');
      expect(sentMessage).toContain('Never forget which tobaccos');
    });
  });

  describe('error handling', () => {
    it('should handle sendMessage errors gracefully', async () => {
      // Mock sendMessage to throw an error
      (bot.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      // Execute handler - should not throw
      await expect(handler(mockMessage)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Error sending start message:',
        expect.any(Error)
      );
    });
  });

  describe('message properties', () => {
    it('should extract chat ID from message', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 999888777 },
        chat: { id: 999888777, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        999888777,
        expect.any(String)
      );
    });

    it('should extract user ID from message', async () => {
      startCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 555444333 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      };

      await handler(mockMessage);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user 555444333')
      );
    });
  });
});
