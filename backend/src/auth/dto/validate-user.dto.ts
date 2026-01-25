import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateUserDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsString()
  username?: string;
}
