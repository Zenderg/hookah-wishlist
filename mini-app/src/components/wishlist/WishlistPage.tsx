import React, { useEffect, useState } from 'react';
import { WishlistItem } from './WishlistItem';
import { Button } from '../ui/Button';
import { Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import { fetchWishlist, removeFromWishlist } from '../../services/wishlist';
import type { WishlistItem as ApiWishlistItem } from '../../types';

export interface WishlistPageProps {
  onAddItem?: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onAddItem }) => {
  const [items, setItems] = useState<ApiWishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadWishlist = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetchWishlist();
      setItems(response.items);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setError('Failed to load wishlist. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRefresh = () => {
    loadWishlist(true);
  };

  const handleRemove = async (itemId: number) => {
    try {
      setRemovingId(itemId);
      await removeFromWishlist(itemId);
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Failed to remove item. Please try again.');
      // Reload wishlist to ensure consistency
      loadWishlist(true);
    } finally {
      setRemovingId(null);
    }
  };

  const getItemDisplayName = (item: ApiWishlistItem): string => {
    // API returns tobacco with nested brand
    if (item.tobacco) {
      return item.tobacco.name;
    }
    return 'Unknown Item';
  };

  const getItemBrand = (item: ApiWishlistItem): string => {
    if (item.tobacco?.brand) {
      return typeof item.tobacco.brand === 'string' ? item.tobacco.brand : item.tobacco.brand.name;
    }
    return 'Unknown Brand';
  };

  const getItemImageUrl = (item: ApiWishlistItem): string | undefined => {
    return item.tobacco?.imageUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
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
                onClick={onAddItem}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-gray-600 mb-4">Start adding tobaccos to your wishlist</p>
            {onAddItem && (
              <Button
                variant="primary"
                onClick={onAddItem}
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
                name={getItemDisplayName(item)}
                brand={getItemBrand(item)}
                imageUrl={getItemImageUrl(item)}
                isPurchased={false}
                onRemove={() => handleRemove(item.id)}
                isRemoving={removingId === item.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
