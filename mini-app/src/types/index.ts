export interface Tobacco {
  id: string;
  name: string;
  brand: string;
  flavor?: string;
  description?: string;
  strength?: 'light' | 'medium' | 'strong';
  image?: string;
}

export interface WishlistItem {
  tobaccoId: string;
  addedAt: string;
  notes?: string;
  tobacco?: Tobacco;
}

export interface Wishlist {
  userId: number;
  items: WishlistItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchParams {
  query: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  results: Tobacco[];
  total: number;
  page: number;
  pageSize: number;
}
