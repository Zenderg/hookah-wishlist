import api from './api';
import type { Tobacco, SearchParams } from '../types';

export interface TobaccoSearchResponse {
  data: Tobacco[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Search tobaccos by name or brand
 */
export async function searchTobaccos(params: SearchParams): Promise<TobaccoSearchResponse> {
  const response = await api.get('/tobaccos', { params });
  return response.data.data;
}

/**
 * Get tobacco details by ID
 */
export async function getTobaccoById(id: number): Promise<Tobacco> {
  const response = await api.get(`/tobaccos/${id}`);
  return response.data.data;
}
