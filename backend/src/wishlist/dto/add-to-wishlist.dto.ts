import { IsString, IsNotEmpty } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsString()
  @IsNotEmpty()
  tobaccoId: string;
}
