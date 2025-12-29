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
    logger.info('[USER SERVICE] Validating user data', {
      telegramId: data.telegramId.toString(),
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Validate telegramId is a valid BigInt
    if (typeof data.telegramId !== 'bigint' && typeof data.telegramId !== 'number') {
      logger.error('[USER SERVICE] Invalid telegramId type', {
        type: typeof data.telegramId,
      });
      throw new Error('Invalid telegramId: must be a BigInt or number');
    }

    // Validate string fields do not exceed 255 characters
    if (data.username && data.username.length > 255) {
      logger.error('[USER SERVICE] Username too long', { length: data.username.length });
      throw new Error('Username must not exceed 255 characters');
    }

    if (data.firstName && data.firstName.length > 255) {
      logger.error('[USER SERVICE] First name too long', { length: data.firstName.length });
      throw new Error('First name must not exceed 255 characters');
    }

    if (data.lastName && data.lastName.length > 255) {
      logger.error('[USER SERVICE] Last name too long', { length: data.lastName.length });
      throw new Error('Last name must not exceed 255 characters');
    }

    // Validate username only contains alphanumeric characters and underscores if provided
    if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
      logger.error('[USER SERVICE] Invalid username format', { username: data.username });
      throw new Error('Username must only contain alphanumeric characters and underscores');
    }

    logger.info('[USER SERVICE] User data validation passed');
  }

  /**
   * Create new user or update existing user from Telegram data
   * @param telegramData - Telegram user data
   * @returns The created or updated user
   * @throws Error if database operation fails
   */
  async createOrUpdateUser(telegramData: TelegramUserData): Promise<any> {
    logger.info('[USER SERVICE] createOrUpdateUser called', {
      telegramId: telegramData.telegramId.toString(),
    });

    try {
      // Validate user data
      this.validateUserData(telegramData);

      // Check if user exists
      logger.info('[USER SERVICE] Checking if user exists in database');
      let user = await this.prisma.user.findUnique({
        where: { telegramId: telegramData.telegramId },
      });

      if (user) {
        logger.info('[USER SERVICE] User exists, updating', {
          userId: user.id,
          telegramId: user.telegramId.toString(),
        });

        // Update existing user
        user = await this.prisma.user.update({
          where: { telegramId: telegramData.telegramId },
          data: {
            username: telegramData.username || user.username,
            firstName: telegramData.firstName || user.firstName,
            lastName: telegramData.lastName || user.lastName,
          },
        });

        logger.info('[USER SERVICE] User updated successfully', {
          userId: user.id,
          telegramId: user.telegramId.toString(),
          username: user.username,
        });
      } else {
        logger.info('[USER SERVICE] User does not exist, creating new user', {
          telegramId: telegramData.telegramId.toString(),
        });

        // Create new user
        user = await this.prisma.user.create({
          data: {
            telegramId: telegramData.telegramId,
            username: telegramData.username || null,
            firstName: telegramData.firstName || null,
            lastName: telegramData.lastName || null,
          },
        });

        logger.info('[USER SERVICE] User created successfully', {
          userId: user.id,
          telegramId: user.telegramId.toString(),
          username: user.username,
        });
      }

      return user;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid')) {
        // Validation error - re-throw as-is
        logger.warn('[USER SERVICE] User validation failed', {
          error: error.message,
          telegramData,
        });
        throw error;
      }

      // Database error - preserve original error details
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[USER SERVICE] Database error creating or updating user', {
        error: errorMessage,
        telegramData,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Database error: ${errorMessage}`);
    }
  }

  /**
   * Find user by Telegram ID
   * @param telegramId - Telegram user ID
   * @returns User or null if not found
   * @throws Error if database operation fails
   */
  async findUserByTelegramId(telegramId: bigint): Promise<any | null> {
    logger.info('[USER SERVICE] findUserByTelegramId called', {
      telegramId: telegramId.toString(),
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        logger.debug('[USER SERVICE] User not found by Telegram ID', {
          telegramId: telegramId.toString(),
        });
        return null;
      }

      logger.info('[USER SERVICE] User found by Telegram ID', {
        userId: user.id,
        telegramId: user.telegramId.toString(),
      });

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[USER SERVICE] Database error finding user by Telegram ID', {
        error: errorMessage,
        telegramId: telegramId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Database error: ${errorMessage}`);
    }
  }

  /**
   * Find user by database ID
   * @param id - Database user ID
   * @returns User or null if not found
   * @throws Error if database operation fails
   */
  async getUserById(id: number): Promise<any | null> {
    logger.info('[USER SERVICE] getUserById called', { userId: id });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.debug('[USER SERVICE] User not found by ID', { userId: id });
        return null;
      }

      logger.info('[USER SERVICE] User found by ID', {
        userId: user.id,
        telegramId: user.telegramId.toString(),
      });

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[USER SERVICE] Database error finding user by ID', {
        error: errorMessage,
        userId: id,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Database error: ${errorMessage}`);
    }
  }
}
