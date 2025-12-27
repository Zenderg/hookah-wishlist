import React from 'react';
import { WishlistItem } from './WishlistItem';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

export interface WishlistPageProps {
  isLoading?: boolean;
  onAddItem?: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ isLoading = false, onAddItem }) => {
  // Placeholder implementation - full functionality will be in Task 4.3
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          {onAddItem && (
            <Button variant="primary" size="sm" onClick={onAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <WishlistItem
              id={1}
              name="Adalya Love 66"
              brand="Adalya"
              imageUrl=""
              isPurchased={false}
              onTogglePurchased={() => {}}
              onRemove={() => {}}
            />
            <WishlistItem
              id={2}
              name="Musthave Easy"
              brand="Musthave"
              imageUrl=""
              isPurchased={true}
              onTogglePurchased={() => {}}
              onRemove={() => {}}
            />
          </div>
        )}

        {!isLoading && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              This is a placeholder. Full wishlist functionality will be implemented in Task 4.3.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
