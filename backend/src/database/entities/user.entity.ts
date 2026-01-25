import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { WishlistItem } from '../../wishlist/entities/wishlist-item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.user, { cascade: true })
  wishlistItems: WishlistItem[];
}
