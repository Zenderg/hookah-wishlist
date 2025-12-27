import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

export interface TelegramUserData {
  telegramId: bigint;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validate Telegram user data
   * @throws Error if validation fails
   */
  validateUserData(data: TelegramUserData): void {
    // Validate telegramId is a valid BigInt
    if (typeof data.telegramId !== 'bigint' && typeof data.telegramId !== 'number') {
      throw new Error('Invalid telegramId: must be a BigInt or number');
    }

    // Validate string fields do not exceed 255 characters
    if (data.username && data.username.length > 255) {
      throw new Error('Username must not exceed 255 characters');
    }

    if (data.firstName && data.firstName.length > 255) {
      throw new Error('First name must not exceed 255 characters');
    }

    if (data.lastName && data.lastName.length > 255) {
      throw new Error('Last name must not exceed 255 characters');
    }

    // Validate username only contains alphanumeric characters and underscores if provided
    if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
      throw new Error('Username must only contain alphanumeric characters and underscores');
    }
  }

  /**
   * Create new user or update existing user from Telegram data
   * @param telegramData - Telegram user data
   * @returns The created or updated user
   */
  async createOrUpdateUser(telegramData: TelegramUserData): Promise<any> {
    try {
      // Validate user data
      this.validateUserData(telegramData);

      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { telegramId: telegramData.telegramId },
      });

      if (user) {
        // Update existing user
        user = await this.prisma.user.update({
          where: { telegramId: telegramData.telegramId },
          data: {
            username: telegramData.username || user.username,
            firstName: telegramData.firstName || user.firstName,
            lastName: telegramData.lastName || user.lastName,
          },
        });

        logger.info('User updated successfully', {
          userId: user.id,
          telegramId: user.telegramId,
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            telegramId: telegramData.telegramId,
            username: telegramData.username || null,
            firstName: telegramData.firstName || null,
            lastName: telegramData.lastName || null,
          },
        });

        logger.info('User created successfully', {
          userId: user.id,
          telegramId: user.telegramId,
        });
      }

      return user;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid')) {
        // Validation error
        logger.warn('User validation failed', { error, telegramData });
        throw error;
      }

      logger.error('Error creating or updating user', { error, telegramData });
      throw new Error('Failed to create or update user');
    }
  }

  /**
   * Find user by Telegram ID
   * @param telegramId - Telegram user ID
   * @returns User or null if not found
   */
  async findUserByTelegramId(telegramId: bigint): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        logger.debug('User not found by Telegram ID', { telegramId });
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error finding user by Telegram ID', { error, telegramId });
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by database ID
   * @param id - Database user ID
   * @returns User or null if not found
   */
  async getUserById(id: number): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.debug('User not found by ID', { id });
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error finding user by ID', { error, id });
      throw new Error('Failed to find user');
    }
  }
}
