import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TobaccoCard } from './TobaccoCard';
import { Search, Filter } from 'lucide-react';

export interface SearchPageProps {
  isLoading?: boolean;
  onAddToWishlist?: (tobaccoId: number) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ isLoading = false, onAddToWishlist }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder implementation - full functionality will be in Task 4.4
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Tobaccos</h1>

        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search by name or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="secondary" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <TobaccoCard
              id={1}
              name="Adalya Love 66"
              brand="Adalya"
              description="A popular mix of watermelon, mint, and rose"
              imageUrl=""
              onAddToWishlist={() => onAddToWishlist?.(1)}
            />
            <TobaccoCard
              id={2}
              name="Musthave Easy"
              brand="Musthave"
              description="Classic easy blend with refreshing notes"
              imageUrl=""
              onAddToWishlist={() => onAddToWishlist?.(2)}
            />
          </div>
        )}

        {!isLoading && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              This is a placeholder. Full search functionality will be implemented in Task 4.4.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
