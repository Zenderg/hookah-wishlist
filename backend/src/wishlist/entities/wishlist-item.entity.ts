import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  tobaccoId: string;

  @Column()
  tobaccoName: string;

  @CreateDateColumn()
  createdAt: Date;
}
