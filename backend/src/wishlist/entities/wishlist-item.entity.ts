import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Entity('wishlist_items')
@Unique(['user', 'tobaccoId'])
@Index(['userId'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.wishlistItems, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column()
  tobaccoId: string;

  @Column()
  tobaccoName: string;

  @CreateDateColumn()
  createdAt: Date;
}
