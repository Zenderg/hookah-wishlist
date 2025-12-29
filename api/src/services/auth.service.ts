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
    logger.info('[AUTH SERVICE] authenticateViaTelegram called', {
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
    });

    try {
      // Convert TelegramUser to TelegramUserData
      const telegramData: TelegramUserData = {
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
      };

      logger.info('[AUTH SERVICE] Converted TelegramUser to TelegramUserData', {
        telegramId: telegramData.telegramId.toString(),
        username: telegramData.username,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName,
      });

      // Create or update user using UserService
      logger.info('[AUTH SERVICE] Calling userService.createOrUpdateUser');
      const user = await this.userService.createOrUpdateUser(telegramData);

      logger.info('[AUTH SERVICE] User authenticated successfully', {
        userId: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
      });

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
      // Preserve the original error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AUTH SERVICE] Error authenticating user', {
        error: errorMessage,
        telegramId: telegramUser.id,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get user by database ID
   */
  async getUserById(userId: number): Promise<AuthResult> {
    logger.info('[AUTH SERVICE] getUserById called', { userId });

    try {
      const user = await this.userService.getUserById(userId);

      if (!user) {
        logger.warn('[AUTH SERVICE] User not found', { userId });
        return {
          success: false,
          error: 'User not found',
        };
      }

      logger.info('[AUTH SERVICE] User found', {
        userId: user.id,
        telegramId: user.telegramId.toString(),
      });

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
      // Preserve the original error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AUTH SERVICE] Error fetching user', {
        error: errorMessage,
        userId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
