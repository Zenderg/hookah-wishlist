import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TobaccoCard } from './TobaccoCard';
import { Search, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchTobaccos } from '../../services/tobacco';
import { useTelegram } from '../../hooks/useTelegram';
import { useMainButton } from '../../contexts/MainButtonContext';
import type { Tobacco } from '../../types';

export interface SearchPageProps {
  onAddToWishlist?: (tobaccoId: number) => Promise<void>;
  isItemInWishlist?: (tobaccoId: number) => boolean;
  isAddingItem?: (tobaccoId: number) => boolean;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onAddToWishlist, isItemInWishlist, isAddingItem }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tobacco[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const { hapticImpact, hapticNotification } = useTelegram();
  const { showMainButton, hideMainButton, setMainButtonLoading } = useMainButton();
  const [selectedTobacco, setSelectedTobacco] = useState<Tobacco | null>(null);

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
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
          page: currentPage,
          limit: 20,
        });
        setSearchResults(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalResults(response.pagination.total);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search tobaccos. Please try again.');
        hapticNotification('error');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, currentPage, hapticNotification]);

  // Show/hide MainButton based on selected tobacco
  useEffect(() => {
    if (selectedTobacco && onAddToWishlist) {
      showMainButton('Add to Wishlist', async () => {
        setMainButtonLoading(true);
        try {
          await onAddToWishlist(selectedTobacco.id);
          setSelectedTobacco(null);
          hapticNotification('success');
        } catch (err) {
          console.error('Failed to add to wishlist:', err);
          hapticNotification('error');
        } finally {
          setMainButtonLoading(false);
        }
      });
    } else {
      hideMainButton();
    }

    // Clean up by hiding MainButton on unmount
    return () => {
      hideMainButton();
    };
  }, [
    selectedTobacco,
    onAddToWishlist,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    hapticNotification,
  ]);

  const handleClearSearch = useCallback(() => {
    hapticImpact('light');
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  }, [hapticImpact]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      hapticImpact('light');
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-tg-text mb-6">Search Tobaccos</h1>

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tg-hint hover:text-tg-text transition-colors"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tg-button"></div>
          </div>
        )}

        {/* Empty State - No Search Yet */}
        {!isLoading && !hasSearched && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-tg-secondary-bg rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-tg-hint" />
            </div>
            <h3 className="text-lg font-semibold text-tg-text mb-2">Search for Tobaccos</h3>
            <p className="text-sm text-tg-hint max-w-xs">
              Enter a tobacco name or brand to find your favorite flavors.
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {!isLoading && hasSearched && searchResults.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-tg-secondary-bg rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-tg-hint" />
            </div>
            <h3 className="text-lg font-semibold text-tg-text mb-2">No Results Found</h3>
            <p className="text-sm text-tg-hint max-w-xs">
              No results for "{debouncedQuery}". Try another term.
            </p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && hasSearched && searchResults.length > 0 && (
          <>
            <p className="text-sm text-tg-hint mb-4">
              Found {totalResults} {totalResults === 1 ? 'result' : 'results'}
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
                  isLoading={isAddingItem?.(tobacco.id)}
                  onAddToWishlist={() => setSelectedTobacco(tobacco)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {hasSearched && searchResults.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <p className="text-sm text-tg-hint">
                  Page {currentPage} of {totalPages} ({totalResults} results)
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
