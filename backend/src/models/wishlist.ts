import { Tobacco } from './tobacco';

export interface WishlistItem {
  tobaccoId: string;
  addedAt: string;
  notes?: string;
}

export interface Wishlist {
  userId: number;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistWithDetails extends Wishlist {
  items: (WishlistItem & { tobacco?: Tobacco })[];
}
