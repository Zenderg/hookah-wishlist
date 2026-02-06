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
      getBrandById: jest.fn(),
      getLineById: jest.fn(),
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
        '❌ Не удалось определить пользователя. Попробуйте еще раз.',
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
        expect.stringContaining('Ваш вишлист пуст'),
        expect.objectContaining({
          parse_mode: 'HTML',
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
          lineId: 'line-1',
        },
        {
          id: 'tobacco-2',
          name: 'Blueberry Muffin',
          brandId: 'brand-2',
          lineId: null,
        },
      ];

      const mockBrands = [
        {
          id: 'brand-1',
          name: 'Starbuzz',
        },
        {
          id: 'brand-2',
          name: 'Al Fakher',
        },
      ];

      const mockLines = [
        {
          id: 'line-1',
          name: 'Bold Series',
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
      hookahDbService.getBrandById.mockImplementation((id) => {
        return Promise.resolve(mockBrands.find(b => b.id === id) as any);
      });
      hookahDbService.getLineById.mockImplementation((id) => {
        return Promise.resolve(mockLines.find(l => l.id === id) as any);
      });

      await handler.handle(mockCtx);

      expect(wishlistService.getUserWishlist).toHaveBeenCalledWith('123456789');
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Ваш вишлист (2 элементов)'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );

      const message = mockCtx.reply.mock.calls[0][0];
      expect(message).toContain('Mint Chocolate');
      expect(message).toContain('Blueberry Muffin');
      expect(message).toContain('Starbuzz');
      expect(message).toContain('Al Fakher');
      expect(message).toContain('🏭 Бренд:');
      expect(message).toContain('📦 Линейка:');
      expect(message).toContain('Bold Series');
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

      // Items should be displayed in order returned by service
      expect(newIndex).toBeLessThan(oldIndex);
    });

    it('should not display line when lineId is null', async () => {
      const mockWishlistItems: WishlistItem[] = [
        {
          id: 1,
          userId: 1,
          tobaccoId: 'tobacco-1',
          createdAt: new Date('2024-01-15'),
          user: mockUser,
        },
      ];

      const mockTobaccos = [
        {
          id: 'tobacco-1',
          name: 'Mint Chocolate',
          brandId: 'brand-1',
          lineId: null,
        },
      ];

      const mockBrands = [
        {
          id: 'brand-1',
          name: 'Starbuzz',
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
      hookahDbService.getBrandById.mockImplementation((id) => {
        return Promise.resolve(mockBrands.find(b => b.id === id) as any);
      });

      await handler.handle(mockCtx);

      const message = mockCtx.reply.mock.calls[0][0];
      expect(message).toContain('Mint Chocolate');
      expect(message).toContain('Starbuzz');
      expect(message).toContain('🏭 Бренд:');
      expect(message).not.toContain('📦 Линейка:');
      expect(hookahDbService.getLineById).not.toHaveBeenCalled();
    });
  });
});
