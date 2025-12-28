import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { TobaccoCard } from './TobaccoCard';
import { Search, X, AlertCircle } from 'lucide-react';
import { searchTobaccos } from '../../services/tobacco';
import type { Tobacco } from '../../types';

export interface SearchPageProps {
  onAddToWishlist?: (tobaccoId: number) => Promise<void>;
  isItemInWishlist?: (tobaccoId: number) => boolean;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onAddToWishlist, isItemInWishlist }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tobacco[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await searchTobaccos({
          q: debouncedQuery,
          page: 1,
          limit: 20,
        });
        setSearchResults(response.data);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search tobaccos. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  const handleAddToWishlist = useCallback(
    async (tobaccoId: number) => {
      if (onAddToWishlist) {
        try {
          await onAddToWishlist(tobaccoId);
        } catch (err) {
          console.error('Failed to add to wishlist:', err);
          setError('Failed to add to wishlist. Please try again.');
        }
      }
    },
    [onAddToWishlist]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Tobaccos</h1>

        {/* Search Input */}
        <div className="mb-4 relative">
          <Input
            type="search"
            placeholder="Search by name or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State - No Search Yet */}
        {!isLoading && !hasSearched && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for Tobaccos</h3>
            <p className="text-sm text-gray-600 max-w-xs">
              Enter a tobacco name or brand to find your favorite flavors.
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {!isLoading && hasSearched && searchResults.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-sm text-gray-600 max-w-xs">
              We couldn't find any tobaccos matching "{debouncedQuery}". Try a
              different search term.
            </p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && hasSearched && searchResults.length > 0 && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </p>
            <div className="space-y-3">
              {searchResults.map((tobacco) => (
                <TobaccoCard
                  key={tobacco.id}
                  id={tobacco.id}
                  name={tobacco.name}
                  brand={tobacco.brand?.name || 'Unknown'}
                  description={tobacco.description}
                  imageUrl={tobacco.imageUrl}
                  isAdded={isItemInWishlist?.(tobacco.id)}
                  onAddToWishlist={() => handleAddToWishlist(tobacco.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
