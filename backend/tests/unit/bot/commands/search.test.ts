/**
 * Unit tests for search command
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

jest.mock('@/services/search.service', () => ({
  __esModule: true,
  default: {
    search: jest.fn(),
    formatSearchResults: jest.fn(),
  },
}));

jest.mock('@/bot/session', () => ({
  __esModule: true,
  sessionManager: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  },
}));

// Import after mocking
import { searchCommand } from '@/bot/commands/search';
import bot from '@/bot/bot';
import searchService from '@/services/search.service';
import { sessionManager } from '@/bot/session';

describe('searchCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command registration', () => {
    it('should register the /search command handler', () => {
      // Execute command registration
      searchCommand();

      // Verify onText was called with the correct regex
      expect(bot.onText).toHaveBeenCalledWith(
        /\/search(?:\s+(.+))?/,
        expect.any(Function)
      );
    });

    it('should register exactly one handler', () => {
      searchCommand();
      expect(bot.onText).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling with valid query', () => {
    it('should search for tobaccos with provided query', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Al Fakher',
      };

      // Mock search service response
      (searchService.search as jest.Mock).mockResolvedValue({
        results: [
          { id: '1', name: 'Mint', brand: 'Al Fakher', flavor: 'Mint' },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        '📊 Search Results (Page 1)\nFound 1 tobacco(s)\n\n1. Al Fakher - Mint\n   🏷️ ID: 1\n   🍃 Flavor: Mint\n\nUse /add <tobacco_id> to add to your wishlist'
      );

      await handler(mockMessage, ['/search Al Fakher', 'Al Fakher']);

      expect(searchService.search).toHaveBeenCalledWith('Al Fakher', 1, 10);
      expect(bot.sendChatAction).toHaveBeenCalledWith(123456789, 'typing');
    });

    it('should send typing action before searching', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Mint',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search Mint', 'Mint']);

      expect(bot.sendChatAction).toHaveBeenCalledWith(123456789, 'typing');
    });

    it('should send formatted search results', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Apple',
      };

      const mockResults = [
        { id: '2', name: 'Double Apple', brand: 'Al Fakher', flavor: 'Apple' },
      ];

      (searchService.search as jest.Mock).mockResolvedValue({
        results: mockResults,
        page: 1,
        pageSize: 10,
        total: 1,
      });

      const formattedMessage = '📊 Search Results (Page 1)\nFound 1 tobacco(s)\n\n1. Al Fakher - Double Apple\n   🏷️ ID: 2\n   🍃 Flavor: Apple\n\nUse /add <tobacco_id> to add to your wishlist';
      (searchService.formatSearchResults as jest.Mock).mockReturnValue(formattedMessage);

      await handler(mockMessage, ['/search Apple', 'Apple']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        formattedMessage,
        { parse_mode: 'HTML' }
      );
    });

    it('should store search query in session', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Grape',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search Grape', 'Grape']);

      expect(sessionManager.set).toHaveBeenCalledWith(123456789, {
        searchQuery: 'Grape',
      });
    });

    it('should log search command', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Blueberry',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search Blueberry', 'Blueberry']);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('/search command received from user 123456789')
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('query: Blueberry')
      );
    });
  });

  describe('message handling with empty query', () => {
    it('should send error message when query is missing', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search',
      };

      await handler(mockMessage, ['/search', undefined]);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Please provide a search query')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('/search <query>')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Example: /search Al Fakher')
      );
    });

    it('should not call search service when query is missing', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search',
      };

      await handler(mockMessage, ['/search', undefined]);

      expect(searchService.search).not.toHaveBeenCalled();
    });

    it('should not store session when query is missing', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search',
      };

      await handler(mockMessage, ['/search', undefined]);

      expect(sessionManager.set).not.toHaveBeenCalled();
    });
  });

  describe('message handling with whitespace-only query', () => {
    it('should send error message when query is only whitespace', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search   ',
      };

      await handler(mockMessage, ['/search   ', '   ']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Please provide a search query')
      );
    });
  });

  describe('handling no results', () => {
    it('should handle empty search results', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search UnknownBrand',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search UnknownBrand', 'UnknownBrand']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        'No tobaccos found. Try a different search term.',
        { parse_mode: 'HTML' }
      );
    });
  });

  describe('error handling', () => {
    it('should handle search service errors gracefully', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search ErrorTest',
      };

      (searchService.search as jest.Mock).mockRejectedValue(
        new Error('Search service failed')
      );

      await handler(mockMessage, ['/search ErrorTest', 'ErrorTest']);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in search command:',
        expect.any(Error)
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('Sorry, an error occurred while searching')
      );
    });

    it('should handle sendMessage errors gracefully', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 123456789 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Test',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      (bot.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      await expect(
        handler(mockMessage, ['/search Test', 'Test'])
      ).resolves.not.toThrow();
    });
  });

  describe('message properties', () => {
    it('should extract chat ID from message', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 999888777 },
        chat: { id: 999888777, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Test',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search Test', 'Test']);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        999888777,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should extract user ID from message', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: { id: 555444333 },
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Test',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search Test', 'Test']);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user 555444333')
      );
      expect(sessionManager.set).toHaveBeenCalledWith(555444333, expect.any(Object));
    });

    it('should handle messages without user ID', async () => {
      searchCommand();

      const handler = (bot.onText as jest.Mock).mock.calls[0][1];
      const mockMessage = {
        message_id: 1,
        from: undefined,
        chat: { id: 123456789, type: 'private' as const },
        date: Math.floor(Date.now() / 1000),
        text: '/search Test',
      };

      (searchService.search as jest.Mock).mockResolvedValue({
        results: [],
        page: 1,
        pageSize: 10,
        total: 0,
      });

      (searchService.formatSearchResults as jest.Mock).mockReturnValue(
        'No tobaccos found. Try a different search term.'
      );

      await handler(mockMessage, ['/search Test', 'Test']);

      expect(sessionManager.set).not.toHaveBeenCalled();
    });
  });
});
