/**
 * Unit tests for help command
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
import { helpCommand } from '@/bot/commands/help';
import bot from '@/bot/bot';

describe('helpCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command registration', () => {
    it('should register the /help command handler', () => {
      // Execute command registration
      helpCommand();

      // Verify onText was called with the correct regex
      expect(bot.onText).toHaveBeenCalledWith(
        /\/help/,
        expect.any(Function)
      );
    });

    it('should register exactly one handler', () => {
      helpCommand();
      expect(bot.onText).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling', () => {
    it('should send help message when the /help command is received', async () => {
      helpCommand();

      // Get the registered handler
      const handler = (bot.onText as jest.Mock).mock.calls[0][1];

      // Create mock message
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789, username: 'testuser' },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      // Execute handler
      await handler(mockMessage);

      // Verify sendMessage was called
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Help - Available Commands')
      );
    });

    it('should log the command reception', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789, username: 'testuser' },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/help command received from user 123456789')
      );
    });

    it('should handle messages without user information', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/help command received from user undefined')
      );
    });
  });

  describe('response formatting', () => {
    it('should include all available commands in the help message', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
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
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify command descriptions are present
      expect(sentMessage).toContain('Search for tobaccos by name or brand');
      expect(sentMessage).toContain('View your current wishlist');
      expect(sentMessage).toContain('Add tobacco to wishlist');
      expect(sentMessage).toContain('Remove from wishlist');
      expect(sentMessage).toContain('Show welcome message');
      expect(sentMessage).toContain('Show this help message');
    });

    it('should include usage examples', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify usage examples are present
      expect(sentMessage).toContain('/search <query>');
      expect(sentMessage).toContain('/add <tobacco_id>');
      expect(sentMessage).toContain('/remove <tobacco_id>');
    });

    it('should include tips section', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      expect(sentMessage).toContain('Tips');
      expect(sentMessage).toContain('Use specific search terms');
      expect(sentMessage).toContain('wishlist is saved automatically');
      expect(sentMessage).toContain('mini-app');
    });

    it('should use emojis in the help message', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify emojis are used
      expect(sentMessage).toContain('📚');
      expect(sentMessage).toContain('🔍');
      expect(sentMessage).toContain('📋');
      expect(sentMessage).toContain('ℹ️');
      expect(sentMessage).toContain('💡');
    });

    it('should organize commands into sections', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      const sentMessage = (bot.sendMessage as jest.Mock).mock.calls[0][1];

      // Verify sections are present
      expect(sentMessage).toContain('Search & Browse');
      expect(sentMessage).toContain('Wishlist Management');
      expect(sentMessage).toContain('General');
    });
  });

  describe('error handling', () => {
    it('should handle sendMessage errors gracefully', async () => {
      // Mock sendMessage to throw an error
      (bot.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      // Execute handler - should not throw
      await expect(handler(mockMessage)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Error sending help message:',
        expect.any(Error)
      );
    });
  });

  describe('message properties', () => {
    it('should extract chat ID from message', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 999888777 },
        chat: { id: 999888777, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        999888777,
        expect.any(String)
      );
    });

    it('should extract user ID from message', async () => {
      helpCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 555444333 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/help',
      };

      await handler(mockMessage);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user 555444333')
      );
    });
  });
});
