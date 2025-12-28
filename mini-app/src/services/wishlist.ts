import api from './api';
import type { WishlistItem as ApiWishlistItem } from '../types';

export interface WishlistResponse {
  items: ApiWishlistItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AddToWishlistRequest {
  tobaccoId: number;
  notes?: string;
}

/**
 * Fetch user's wishlist
 */
export async function fetchWishlist(
  page: number = 1,
  limit: number = 20
): Promise<WishlistResponse> {
  const response = await api.get('/wishlist', {
    params: { page, limit },
  });
  return response.data.data;
}

/**
 * Add tobacco to wishlist
 */
export async function addToWishlist(data: AddToWishlistRequest): Promise<ApiWishlistItem> {
  const response = await api.post('/wishlist/items', data);
  return response.data.data;
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(itemId: number): Promise<{ message: string }> {
  const response = await api.delete(`/wishlist/items/${itemId}`);
  return response.data.data;
}
