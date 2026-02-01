import { Test, TestingModule } from '@nestjs/testing';
import { WishlistHandler } from './wishlist.handler';
import { WishlistService } from '../../wishlist/wishlist.service';
import { WishlistItem } from '../../wishlist/entities/wishlist-item.entity';
import { User } from '../../database/entities/user.entity';
import { HookahDbService } from '../../hookah-db/hookah-db.service';

describe('WishlistHandler', () => {
  let handler: WishlistHandler;
  let wishlistService: jest.Mocked<Pick<WishlistService, 'getUserWishlist'>>;
  let hookahDbService: jest.Mocked<Partial<HookahDbService>>;

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

    const mockHookahDbService = {
      getTobaccoById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistHandler,
        {
          provide: WishlistService,
          useValue: mockWishlistService,
        },
        {
          provide: HookahDbService,
          useValue: mockHookahDbService,
        },
      ],
    }).compile();

    handler = module.get<WishlistHandler>(WishlistHandler);
    wishlistService = mockWishlistService as jest.Mocked<Pick<WishlistService, 'getUserWishlist'>>;
    hookahDbService = mockHookahDbService as jest.Mocked<Partial<HookahDbService>>;
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
          createdAt: new Date('2024-01-15'),
          user: mockUser,
        },
        {
          id: 2,
          userId: 1,
          tobaccoId: 'tobacco-2',
          createdAt: new Date('2024-01-20'),
          user: mockUser,
        },
      ];

      const mockTobaccos = [
        {
          id: 'tobacco-1',
          name: 'Mint Chocolate',
          brandId: 'brand-1',
        },
        {
          id: 'tobacco-2',
          name: 'Blueberry Muffin',
          brandId: 'brand-2',
        },
      ];

      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue({}),
      };

      wishlistService.getUserWishlist.mockResolvedValue(mockWishlistItems);
      hookahDbService.getTobaccoById.mockImplementation((id) => {
        return Promise.resolve(mockTobaccos.find(t => t.id === id) as any);
      });

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
          tobaccoId: 'tobacco-2',
          createdAt: new Date('2024-01-10'),
          user: mockUser,
        },
        {
          id: 2,
          userId: 1,
          tobaccoId: 'tobacco-1',
          createdAt: new Date('2024-01-20'),
          user: mockUser,
        },
      ];

      const mockTobaccos = [
        {
          id: 'tobacco-2',
          name: 'New Tobacco',
          brandId: 'brand-2',
        },
        {
          id: 'tobacco-1',
          name: 'Old Tobacco',
          brandId: 'brand-1',
        },
      ];

      const mockCtx = {
        from: { id: 123456789 },
        reply: jest.fn().mockResolvedValue({}),
      };

      wishlistService.getUserWishlist.mockResolvedValue(mockWishlistItems);
      hookahDbService.getTobaccoById.mockImplementation((id) => {
        return Promise.resolve(mockTobaccos.find(t => t.id === id) as any);
      });

      await handler.handle(mockCtx);

      const message = mockCtx.reply.mock.calls[0][0];
      const newIndex = message.indexOf('New Tobacco');
      const oldIndex = message.indexOf('Old Tobacco');

      // Items should be displayed in the order returned by service
      expect(newIndex).toBeLessThan(oldIndex);
    });
  });
});
