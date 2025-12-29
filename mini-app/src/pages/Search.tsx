import React, { useState } from 'react';
import { SearchPage } from '../components/search/SearchPage';
import { useWishlistStore } from '../stores/wishlist';
import { addToWishlist as addToWishlistApi } from '../services/wishlist';

export const Search: React.FC = () => {
  const { items, addItem } = useWishlistStore();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [addingItem, setAddingItem] = useState<number | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToWishlist = async (tobaccoId: number) => {
    if (addingItem) return;

    try {
      // Check if already in wishlist
      const alreadyInWishlist = items.some((item) => item.tobaccoId === tobaccoId);
      if (alreadyInWishlist) {
        showNotification('error', 'Already in wishlist!');
        return;
      }

      setAddingItem(tobaccoId);

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
      showNotification('success', 'Added to wishlist!');
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      showNotification('error', 'Failed to add to wishlist. Please try again.');
    } finally {
      setAddingItem(null);
    }
  };

  const isItemInWishlist = (tobaccoId: number): boolean => {
    return items.some((item) => item.tobaccoId === tobaccoId);
  };

  const isAddingItem = (tobaccoId: number): boolean => {
    return addingItem === tobaccoId;
  };

  return (
    <>
      {notification && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-white text-center z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}
      <SearchPage
        onAddToWishlist={handleAddToWishlist}
        isItemInWishlist={isItemInWishlist}
        isAddingItem={isAddingItem}
      />
    </>
  );
};
