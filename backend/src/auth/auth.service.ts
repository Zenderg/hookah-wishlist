import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { ValidateUserDto } from './dto/validate-user.dto';
import { parse, validate } from '@tma.js/init-data-node';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async validateUser(validateUserDto: ValidateUserDto) {
    // Find existing user by telegramId
    let user = await this.userRepository.findOne({
      where: { telegramId: validateUserDto.telegramId },
    });

    // If user doesn't exist, create a new one
    if (!user) {
      user = this.userRepository.create({
        telegramId: validateUserDto.telegramId,
        username: validateUserDto.username,
      });
      await this.userRepository.save(user);
    } else {
      // Update username if it has changed
      if (user.username !== validateUserDto.username) {
        user.username = validateUserDto.username;
        await this.userRepository.save(user);
      }
    }

    return {
      valid: true,
      telegramId: user.telegramId,
      username: user.username,
      userId: user.id,
    };
  }

  async validateInitData(initDataRaw: string) {
    if (!initDataRaw) {
      throw new UnauthorizedException('Init data is required');
    }

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Bot token not configured');
    }

    try {
      // Parse and validate the init data
      const initData = parse(initDataRaw);
      
      // Validate signature - throws error if invalid
      validate(initDataRaw, botToken);

      // Extract user data from init data
      const telegramId = initData.user?.id?.toString();
      const username = initData.user?.username;

      if (!telegramId) {
        throw new UnauthorizedException('User ID not found in init data');
      }

      // Find existing user by telegramId
      let user = await this.userRepository.findOne({
        where: { telegramId },
      });

      // If user doesn't exist, create a new one
      if (!user) {
        user = this.userRepository.create({
          telegramId,
          username,
        });
        await this.userRepository.save(user);
      } else {
        // Update username if it has changed
        if (user.username !== username) {
          user.username = username;
          await this.userRepository.save(user);
        }
      }

      return {
        valid: true,
        telegramId: user.telegramId,
        username: user.username,
        userId: user.id,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to validate init data');
    }
  }
}
