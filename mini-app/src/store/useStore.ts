import { create } from 'zustand';
import { Tobacco, Wishlist } from '../types';
import apiService from '../services/api';

interface StoreState {
  wishlist: Wishlist | null;
  searchResults: Tobacco[];
  searchQuery: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWishlist: () => Promise<void>;
  addToWishlist: (tobaccoId: string, notes?: string) => Promise<void>;
  removeFromWishlist: (tobaccoId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  searchTobaccos: (query: string, page?: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
}

export const useStore = create<StoreState>((set) => ({
  wishlist: null,
  searchResults: [],
  searchQuery: '',
  currentPage: 1,
  isLoading: false,
  error: null,

  fetchWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const wishlist = await apiService.getWishlist();
      set({ wishlist, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch wishlist', isLoading: false });
    }
  },

  addToWishlist: async (tobaccoId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const wishlist = await apiService.addToWishlist(tobaccoId, notes);
      set({ wishlist, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to add to wishlist', isLoading: false });
      throw error;
    }
  },

  removeFromWishlist: async (tobaccoId: string) => {
    set({ isLoading: true, error: null });
    try {
      const wishlist = await apiService.removeFromWishlist(tobaccoId);
      set({ wishlist, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to remove from wishlist', isLoading: false });
      throw error;
    }
  },

  clearWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiService.clearWishlist();
      set({ wishlist: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to clear wishlist', isLoading: false });
    }
  },

  searchTobaccos: async (query: string, page: number = 1) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiService.searchTobaccos(query, page);
      set({ 
        searchResults: result.results, 
        currentPage: page,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to search', isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },

  clearError: () => {
    set({ error: null });
  },
}));
