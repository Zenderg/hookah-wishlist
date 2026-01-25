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
        expect.stringContaining('How to use Hookah Wishlist'),
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
      expect(message).toContain('Discover Tobaccos');
      expect(message).toContain('Save to Wishlist');
      expect(message).toContain('View Your Wishlist');
      expect(message).toContain('Visit a Tobacco Shop');
      expect(message).toContain('Tips');
    });
  });
});
