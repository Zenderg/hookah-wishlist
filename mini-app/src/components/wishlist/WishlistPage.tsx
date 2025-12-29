import React, { useEffect, useState } from 'react';
import { WishlistItem } from './WishlistItem';
import { Button } from '../ui/Button';
import { Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import { fetchWishlist, removeFromWishlist, updateWishlistItem } from '../../services/wishlist';
import { useTelegram } from '../../hooks/useTelegram';
import { useMainButton } from '../../contexts/MainButtonContext';
import { useWishlistStore } from '../../stores/wishlist';
import type { WishlistItem as ApiWishlistItem } from '../../types';

export interface WishlistPageProps {
  onAddItem?: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onAddItem }) => {
  const { items, isLoading, error, setItems, setLoading, setError, removeItem, updateItem } =
    useWishlistStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { hapticImpact, hapticNotification } = useTelegram();
  const { showMainButton, hideMainButton, setMainButtonLoading } = useMainButton();

  const loadWishlist = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetchWishlist();

      // Convert API items to store format
      const storeItems = response.items.map((apiItem: ApiWishlistItem) => ({
        id: apiItem.id,
        tobaccoId: apiItem.tobaccoId,
        customName: apiItem.customName,
        customBrand: apiItem.customBrand,
        isPurchased: apiItem.isPurchased,
        purchasedAt: apiItem.purchasedAt ? new Date(apiItem.purchasedAt) : undefined,
        createdAt: new Date(apiItem.createdAt),
        tobacco: apiItem.tobacco
          ? {
              id: apiItem.tobacco.id,
              name: apiItem.tobacco.name,
              brand:
                typeof apiItem.tobacco.brand === 'string'
                  ? apiItem.tobacco.brand
                  : apiItem.tobacco.brand?.name || 'Unknown Brand',
              imageUrl: apiItem.tobacco.imageUrl,
            }
          : undefined,
      }));

      setItems(storeItems);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setError('Failed to load wishlist. Please try again.');
      hapticNotification('error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    if (onAddItem) {
      showMainButton('Add Item', () => {
        hapticImpact('light');
        onAddItem();
      });
    } else {
      hideMainButton();
    }

    return () => {
      hideMainButton();
    };
  }, [onAddItem, showMainButton, hideMainButton, hapticImpact]);

  const handleRefresh = () => {
    hapticImpact('light');
    loadWishlist(true);
  };

  const handleRemove = async (itemId: number) => {
    try {
      setRemovingId(itemId);
      hapticImpact('medium');
      await removeFromWishlist(itemId);
      removeItem(itemId);
      hapticNotification('success');
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Failed to remove item. Please try again.');
      hapticNotification('error');
      // Reload wishlist to ensure consistency
      loadWishlist(true);
    } finally {
      setRemovingId(null);
    }
  };

  const handleTogglePurchased = async (itemId: number, isPurchased: boolean) => {
    try {
      hapticImpact('light');
      await updateWishlistItem(itemId, { isPurchased: !isPurchased });
      updateItem(itemId, { isPurchased: !isPurchased });
      hapticNotification('success');
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Failed to update item. Please try again.');
      hapticNotification('error');
      loadWishlist(true);
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-tg-text">My Wishlist</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {onAddItem && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  hapticImpact('light');
                  onAddItem();
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tg-button"></div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-tg-secondary-bg flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-tg-hint" />
            </div>
            <h3 className="text-lg font-semibold text-tg-text mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-tg-hint mb-4">Start adding tobaccos to your wishlist</p>
            {onAddItem && (
              <Button
                variant="primary"
                onClick={() => {
                  hapticImpact('light');
                  onAddItem();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          /* Wishlist Items */
          <div className="space-y-3">
            {items.map((item) => (
              <WishlistItem
                key={item.id}
                id={item.id}
                name={item.tobacco?.name || item.customName || 'Unknown Item'}
                brand={item.tobacco?.brand || item.customBrand || 'Unknown Brand'}
                imageUrl={item.tobacco?.imageUrl}
                isPurchased={item.isPurchased}
                onRemove={() => handleRemove(item.id)}
                isRemoving={removingId === item.id}
                onTogglePurchased={() => handleTogglePurchased(item.id, item.isPurchased)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
