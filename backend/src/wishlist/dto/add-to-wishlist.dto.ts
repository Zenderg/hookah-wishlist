import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  @IsNotEmpty()
  tobaccoId: string;

  @IsString()
  @IsOptional()
  telegramId?: string;
}
