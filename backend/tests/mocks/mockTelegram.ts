/**
 * Mock objects for Telegram Bot API testing
 */

export interface MockTelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_bot?: boolean;
}

export interface MockTelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface MockTelegramMessage {
  message_id: number;
  from: MockTelegramUser;
  chat: MockTelegramChat;
  date: number;
  text?: string;
  caption?: string;
  reply_to_message?: MockTelegramMessage;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface MockTelegramBot {
  sendMessage: jest.Mock;
  sendPhoto: jest.Mock;
  sendChatAction: jest.Mock;
  answerCallbackQuery: jest.Mock;
  editMessageText: jest.Mock;
  editMessageReplyMarkup: jest.Mock;
  onText: jest.Mock;
  on: jest.Mock;
  removeListener: jest.Mock;
}

/**
 * Create a mock Telegram user object
 */
export const createMockTelegramUser = (overrides: Partial<MockTelegramUser> = {}): MockTelegramUser => ({
  id: 123456789,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  language_code: 'en',
  is_bot: false,
  ...overrides,
});

/**
 * Create a mock Telegram chat object
 */
export const createMockTelegramChat = (overrides: Partial<MockTelegramChat> = {}): MockTelegramChat => ({
  id: 123456789,
  type: 'private',
  title: 'Test Chat',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  ...overrides,
});

/**
 * Create a mock Telegram message object
 */
export const createMockTelegramMessage = (text: string, overrides: Partial<MockTelegramMessage> = {}): MockTelegramMessage => ({
  message_id: 1,
  from: createMockTelegramUser(),
  chat: createMockTelegramChat(),
  date: Math.floor(Date.now() / 1000),
  text,
  ...overrides,
});

/**
 * Create a mock Telegram bot instance
 */
export const createMockTelegramBot = (): MockTelegramBot => ({
  sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
  sendPhoto: jest.fn().mockResolvedValue({ message_id: 1 }),
  sendChatAction: jest.fn().mockResolvedValue(true),
  answerCallbackQuery: jest.fn().mockResolvedValue(true),
  editMessageText: jest.fn().mockResolvedValue({ message_id: 1 }),
  editMessageReplyMarkup: jest.fn().mockResolvedValue({ message_id: 1 }),
  onText: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
});

/**
 * Create a mock Telegram context object (similar to node-telegram-bot-api context)
 */
export const createMockTelegramContext = (text: string, overrides: Partial<MockTelegramMessage> = {}) => {
  const message = createMockTelegramMessage(text, overrides);
  const bot = createMockTelegramBot();

  return {
    message,
    from: message.from,
    chat: message.chat,
    bot,
    text: message.text,
    reply: jest.fn(),
    replyWithPhoto: jest.fn(),
    replyWithMarkdown: jest.fn(),
    replyWithHTML: jest.fn(),
    editMessageText: jest.fn(),
    editMessageReplyMarkup: jest.fn(),
  };
};
