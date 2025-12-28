import React from 'react';
import { SearchPage } from '../components/search/SearchPage';
import { useWishlistStore } from '../stores/wishlist';
import { addToWishlist as addToWishlistApi } from '../services/wishlist';

export const Search: React.FC = () => {
  const { items, addItem } = useWishlistStore();

  const handleAddToWishlist = async (tobaccoId: number) => {
    try {
      // Check if already in wishlist
      const alreadyInWishlist = items.some((item) => item.tobaccoId === tobaccoId);
      if (alreadyInWishlist) {
        alert('Already in wishlist!');
        return;
      }

      // Add to wishlist via API
      const newItem = await addToWishlistApi({ tobaccoId });

      // Convert API response to store format
      const storeItem = {
        id: newItem.id,
        wishlistId: newItem.wishlistId,
        tobaccoId: newItem.tobaccoId,
        customName: newItem.customName,
        customBrand: newItem.customBrand,
        isPurchased: newItem.isPurchased,
        purchasedAt: newItem.purchasedAt ? new Date(newItem.purchasedAt) : undefined,
        createdAt: new Date(newItem.createdAt),
        tobacco: newItem.tobacco
          ? {
              id: newItem.tobacco.id,
              name: newItem.tobacco.name,
              brand: newItem.tobacco.brand?.name || 'Unknown',
              imageUrl: newItem.tobacco.imageUrl,
            }
          : undefined,
      };

      addItem(storeItem);
      alert('Added to wishlist!');
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      alert('Failed to add to wishlist. Please try again.');
    }
  };

  const isItemInWishlist = (tobaccoId: number): boolean => {
    return items.some((item) => item.tobaccoId === tobaccoId);
  };

  return (
    <SearchPage
      onAddToWishlist={handleAddToWishlist}
      isItemInWishlist={isItemInWishlist}
    />
  );
};
