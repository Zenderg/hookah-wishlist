export interface Tobacco {
  id: string;
  name: string;
  brand: string;
  flavor: string;
  description?: string;
  strength?: 'light' | 'medium' | 'strong';
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TobaccoSearchResult {
  results: Tobacco[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TobaccoSearchParams {
  query?: string;
  brand?: string;
  flavor?: string;
  page?: number;
  pageSize?: number;
}
