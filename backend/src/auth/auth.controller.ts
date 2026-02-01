import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ValidateUserDto } from './dto/validate-user.dto';
import { ValidateInitDataDto } from './dto/validate-init-data.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateUser(@Body() validateUserDto: ValidateUserDto) {
    return this.authService.validateUser(validateUserDto);
  }

  @Post('validate-init-data')
  @HttpCode(HttpStatus.OK)
  async validateInitData(
    @Body() validateInitDataDto?: ValidateInitDataDto,
    @Headers('x-telegram-init-data') initDataHeader?: string,
  ) {
    // Accept init data from either header or body
    const initData = initDataHeader || validateInitDataDto?.initData;
    return this.authService.validateInitData(initData);
  }
}
