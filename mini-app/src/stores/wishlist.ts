import { create } from 'zustand';

export interface WishlistItem {
  id: number;
  tobaccoId?: number;
  customName?: string;
  customBrand?: string;
  isPurchased: boolean;
  purchasedAt?: Date;
  createdAt: Date;
  tobacco?: {
    id: number;
    name: string;
    brand: string;
    imageUrl?: string;
  };
}

export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  setItems: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (itemId: number) => void;
  updateItem: (itemId: number, updates: Partial<WishlistItem>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),

  updateItem: (itemId, updates) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
