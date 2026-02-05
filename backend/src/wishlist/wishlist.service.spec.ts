import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { User } from '../database/entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { HookahDbService } from '../hookah-db/hookah-db.service';

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistRepository: Repository<WishlistItem>;
  let userRepository: Repository<User>;

  const mockWishlistRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockHookahDbService = {
    getTobaccosByIdsWithDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getRepositoryToken(WishlistItem),
          useValue: mockWishlistRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: HookahDbService,
          useValue: mockHookahDbService,
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    wishlistRepository = module.get<Repository<WishlistItem>>(getRepositoryToken(WishlistItem));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockHookahDbService.getTobaccosByIdsWithDetails.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserWishlist', () => {
    const telegramId = '123456789';

    it('should return empty array when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserWishlist(telegramId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(result).toEqual([]);
    });

    it('should return user wishlist items when user exists', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      const wishlistItems = [
        {
          id: 1,
          userId: 1,
          tobaccoId: 'tobacco-1',
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          tobaccoId: 'tobacco-2',
          createdAt: new Date(),
        },
      ];

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWishlistRepository.find.mockResolvedValue(wishlistItems);

      const result = await service.getUserWishlist(telegramId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(mockWishlistRepository.find).toHaveBeenCalledWith({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(wishlistItems);
    });
  });

  describe('addToWishlist', () => {
    const telegramId = '123456789';
    const tobaccoId = 'tobacco-1';

    it('should create user and new wishlist item when user not found', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: null,
        createdAt: new Date(),
      };

      const newItem = {
        id: 1,
        userId: 1,
        tobaccoId: 'tobacco-1',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null); // First call for user lookup
      mockUserRepository.create.mockReturnValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(null); // Check for existing item
      mockWishlistRepository.create.mockReturnValue(newItem);
      mockWishlistRepository.save.mockResolvedValue(newItem);

      const result = await service.addToWishlist(telegramId, tobaccoId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        telegramId,
        username: null,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(mockWishlistRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        tobaccoId,
      });
      expect(result).toEqual(newItem);
    });

    it('should return existing item if already in wishlist', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      const existingItem = {
        id: 1,
        userId: 1,
        tobaccoId: 'tobacco-1',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(existingItem);

      const result = await service.addToWishlist(telegramId, tobaccoId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(mockWishlistRepository.findOne).toHaveBeenCalledWith({
        where: { userId: user.id, tobaccoId },
      });
      expect(result).toEqual(existingItem);
    });

    it('should create new wishlist item', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      const newItem = {
        id: 1,
        userId: 1,
        tobaccoId: 'tobacco-1',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(null);
      mockWishlistRepository.create.mockReturnValue(newItem);
      mockWishlistRepository.save.mockResolvedValue(newItem);

      const result = await service.addToWishlist(telegramId, tobaccoId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(mockWishlistRepository.findOne).toHaveBeenCalledWith({
        where: { userId: user.id, tobaccoId },
      });
      expect(mockWishlistRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        tobaccoId,
      });
      expect(mockWishlistRepository.save).toHaveBeenCalledWith(newItem);
      expect(result).toEqual(newItem);
    });
  });

  describe('removeFromWishlist', () => {
    const telegramId = '123456789';
    const itemId = '1';

    it('should create user when not found and throw NotFoundException for missing item', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: null,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null); // First call for user lookup
      mockUserRepository.create.mockReturnValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(null); // Item not found

      await expect(service.removeFromWishlist(itemId, telegramId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        telegramId,
        username: null,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when wishlist item not found', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromWishlist(itemId, telegramId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when item belongs to different user', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      const wishlistItem = {
        id: 1,
        userId: 2,
        tobaccoId: 'tobacco-1',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(wishlistItem);

      await expect(service.removeFromWishlist(itemId, telegramId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete wishlist item successfully', async () => {
      const user = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      const wishlistItem = {
        id: 1,
        userId: 1,
        tobaccoId: 'tobacco-1',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockWishlistRepository.findOne.mockResolvedValue(wishlistItem);
      mockWishlistRepository.delete.mockResolvedValue({ affected: 1 });

      await service.removeFromWishlist(itemId, telegramId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId },
      });
      expect(mockWishlistRepository.findOne).toHaveBeenCalledWith({
        where: { id: Number(itemId) },
      });
      expect(mockWishlistRepository.delete).toHaveBeenCalledWith(itemId);
    });
  });
});
