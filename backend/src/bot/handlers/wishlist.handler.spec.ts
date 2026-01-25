import { Test, TestingModule } from '@nestjs/testing';
import { WishlistHandler } from './wishlist.handler';
import { WishlistService } from '../../wishlist/wishlist.service';
import { WishlistItem } from '../../wishlist/entities/wishlist-item.entity';
import { User } from '../../database/entities/user.entity';

describe('WishlistHandler', () => {
  let handler: WishlistHandler;
  let wishlistService: jest.Mocked<Pick<WishlistService, 'getUserWishlist'>>;

  const mockUser: User = {
    id: 1,
    telegramId: '123456789',
    username: 'testuser',
    createdAt: new Date(),
    wishlistItems: [],
  };

  beforeEach(async () => {
    const mockWishlistService = {
      getUserWishlist: jest.fn(),
      addToWishlist: jest.fn(),
      removeFromWishlist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistHandler,
        {
          provide: WishlistService,
          useValue: mockWishlistService,
        },
      ],
    }).compile();

    handler = module.get<WishlistHandler>(WishlistHandler);
    wishlistService = mockWishlistService as jest.Mocked<Pick<WishlistService, 'getUserWishlist'>>;
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should reply with error message if user ID is not available', async () => {
      const mockCtx = {
        from: {},
        reply: jest.fn().mockResolvedValue({}),
      };

      await handler.handle(mockCtx);

      expect(mockCtx.reply).toHaveBeenCalledWith(
        '❌ Unable to identify user. Please try again.',
      );
      expect(wishlistService.getUserWishlist).not.toHaveBeenCalled();
    });

    it('should display empty wishlist message when wishlist is empty', async () => {
      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue({}),
      };

      wishlistService.getUserWishlist.mockResolvedValue([]);

      await handler.handle(mockCtx);

      expect(wishlistService.getUserWishlist).toHaveBeenCalledWith('123456789');
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Your wishlist is empty'),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🔍 Discover Tobaccos',
                }),
              ]),
            ]),
          }),
        }),
      );
    });

    it('should display wishlist items when wishlist is not empty', async () => {
      const mockWishlistItems: WishlistItem[] = [
        {
          id: 1,
          userId: 1,
          tobaccoId: 'tobacco-1',
          tobaccoName: 'Mint Chocolate',
          createdAt: new Date('2024-01-15'),
          user: mockUser,
        },
        {
          id: 2,
          userId: 1,
          tobaccoId: 'tobacco-2',
          tobaccoName: 'Blueberry Muffin',
          createdAt: new Date('2024-01-20'),
          user: mockUser,
        },
      ];

      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue({}),
      };

      wishlistService.getUserWishlist.mockResolvedValue(mockWishlistItems);

      await handler.handle(mockCtx);

      expect(wishlistService.getUserWishlist).toHaveBeenCalledWith('123456789');
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Your Wishlist (2 items)'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );

      const message = mockCtx.reply.mock.calls[0][0];
      expect(message).toContain('Mint Chocolate');
      expect(message).toContain('Blueberry Muffin');
    });

    it('should display items in the order returned by service', async () => {
      const mockWishlistItems: WishlistItem[] = [
        {
          id: 1,
          userId: 1,
          tobaccoId: 'tobacco-1',
          tobaccoName: 'New Tobacco',
          createdAt: new Date('2024-01-20'),
          user: mockUser,
        },
        {
          id: 2,
          userId: 1,
          tobaccoId: 'tobacco-2',
          tobaccoName: 'Old Tobacco',
          createdAt: new Date('2024-01-10'),
          user: mockUser,
        },
      ];

      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue({}),
      };

      wishlistService.getUserWishlist.mockResolvedValue(mockWishlistItems);

      await handler.handle(mockCtx);

      const message = mockCtx.reply.mock.calls[0][0];
      const newIndex = message.indexOf('New Tobacco');
      const oldIndex = message.indexOf('Old Tobacco');

      // Items should be displayed in the order returned by service
      expect(newIndex).toBeLessThan(oldIndex);
    });
  });
});
