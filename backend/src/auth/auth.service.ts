import { Injectable } from '@nestjs/common';
import { ValidateUserDto } from './dto/validate-user.dto';

@Injectable()
export class AuthService {
  async validateUser(validateUserDto: ValidateUserDto) {
    // TODO: Implement Telegram user ID validation
    // For now, just return the user data
    return {
      valid: true,
      telegramId: validateUserDto.telegramId,
      username: validateUserDto.username,
    };
  }
}
