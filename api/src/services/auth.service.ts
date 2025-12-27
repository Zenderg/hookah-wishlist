import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import type { TelegramUser } from '../utils/telegram.js';
import { UserService, type TelegramUserData } from './user.service.js';

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    telegramId: number;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

export class AuthService {
  private userService: UserService;

  constructor(private prisma: PrismaClient) {
    this.userService = new UserService(prisma);
  }

  /**
   * Authenticate user via Telegram initData
   * Creates user if not exists, updates if exists
   */
  async authenticateViaTelegram(telegramUser: TelegramUser): Promise<AuthResult> {
    try {
      // Convert TelegramUser to TelegramUserData
      const telegramData: TelegramUserData = {
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
      };

      // Create or update user using UserService
      const user = await this.userService.createOrUpdateUser(telegramData);

      logger.info('User authenticated successfully', { userId: user.id, telegramId: user.telegramId });

      return {
        success: true,
        user: {
          id: user.id,
          telegramId: Number(user.telegramId),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      logger.error('Error authenticating user', { error, telegramId: telegramUser.id });
      return {
        success: false,
        error: 'Failed to authenticate user',
      };
    }
  }

  /**
   * Get user by database ID
   */
  async getUserById(userId: number): Promise<AuthResult> {
    try {
      const user = await this.userService.getUserById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          telegramId: Number(user.telegramId),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      logger.error('Error fetching user', { error, userId });
      return {
        success: false,
        error: 'Failed to fetch user',
      };
    }
  }
}
