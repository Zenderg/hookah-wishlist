import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import type { TelegramUser } from '../utils/telegram.js';

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
  constructor(private prisma: PrismaClient) {}

  /**
   * Authenticate user via Telegram initData
   * Creates user if not exists, updates if exists
   */
  async authenticateViaTelegram(telegramUser: TelegramUser): Promise<AuthResult> {
    try {
      const telegramId = BigInt(telegramUser.id);

      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { telegramId },
      });

      if (user) {
        // Update existing user
        user = await this.prisma.user.update({
          where: { telegramId },
          data: {
            username: telegramUser.username || user.username,
            firstName: telegramUser.first_name || user.firstName,
            lastName: telegramUser.last_name || user.lastName,
          },
        });

        logger.info('User updated successfully', { userId: user.id, telegramId });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            telegramId,
            username: telegramUser.username || null,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name || null,
          },
        });

        logger.info('User created successfully', { userId: user.id, telegramId });
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

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
