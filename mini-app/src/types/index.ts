// User types
export interface User {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  isBot?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tobacco types
export interface Tobacco {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  brandId: number;
  htreviewsUrl?: string;
  metadata?: Record<string, unknown>;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
}

// Brand types
export interface Brand {
  id: number;
  name: string;
  slug: string;
  htreviewsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Wishlist types
export interface Wishlist {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: number;
  wishlistId: number;
  tobaccoId?: number;
  customName?: string;
  customBrand?: string;
  isPurchased: boolean;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
  tobacco?: Tobacco;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search types
export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  brandId?: number;
}

// Auth types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface TelegramAuthData {
  initData: string;
}

// Navigation types
export type Route = '/' | '/search' | '/brands' | '/profile';

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
