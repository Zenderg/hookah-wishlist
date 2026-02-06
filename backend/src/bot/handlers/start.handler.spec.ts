import { Test, TestingModule } from '@nestjs/testing';
import { StartHandler } from './start.handler';

describe('StartHandler', () => {
  let handler: StartHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StartHandler],
    }).compile();

    handler = module.get<StartHandler>(StartHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should reply with welcome message and mini-app button', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue({}),
      };

      await handler.handle(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Добро пожаловать в Hookah Wishlist!'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );
    });

    it('should include all available commands in message', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue({}),
      };

      await handler.handle(mockCtx);

      const message = mockCtx.reply.mock.calls[0][0];
      expect(message).toContain('/start');
      expect(message).toContain('/help');
      expect(message).toContain('/wishlist');
    });

    it('should include information about URL-based wishlist addition', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue({}),
      };

      await handler.handle(mockCtx);

      const message = mockCtx.reply.mock.calls[0][0];
      expect(message).toContain('Быстрое добавление по ссылке');
      expect(message).toContain('htreviews.org');
      expect(message).toContain('автоматически найду');
    });
  });
});
