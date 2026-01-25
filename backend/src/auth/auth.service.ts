import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { ValidateUserDto } from './dto/validate-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
}
