import { Test, TestingModule } from '@nestjs/testing';
import { HelpHandler } from './help.handler';

describe('HelpHandler', () => {
  let handler: HelpHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelpHandler],
    }).compile();

    handler = module.get<HelpHandler>(HelpHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should reply with help message', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue({}),
      };

      await handler.handle(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Как использовать Hookah Wishlist'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );
    });

    it('should include all sections in help message', async () => {
      const mockCtx = {
        reply: jest.fn().mockResolvedValue({}),
      };

      await handler.handle(mockCtx);

      const message = mockCtx.reply.mock.calls[0][0];
      expect(message).toContain('Найти табаки');
      expect(message).toContain('Сохранить в вишлист');
      expect(message).toContain('Посмотреть ваш вишлист');
      expect(message).toContain('Посетить магазин табаков');
      expect(message).toContain('Советы');
    });
  });
});
