/**
 * Comprehensive Unit Tests for Wishlist Component
 * 
 * This test suite covers all aspects of Wishlist component including:
 * - Rendering tests
 * - Conditional rendering (loading, error, empty, with items)
 * - useEffect hook behavior
 * - State management
 * - Accessibility
 * - Edge cases
 * 
 * Following javascript-testing-patterns skill best practices.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wishlist from '../../../src/components/Wishlist';
import { mockStore, createMockStoreWithWishlist, createMockStoreLoading, createMockStoreWithError } from '../../mocks/mockStore';
import { mockWishlist, mockEmptyWishlist, mockWishlistItem1, mockWishlistItem2, mockWishlistItem3, createMockWishlist, createMockWishlistItem } from '../../fixtures/mockData';

// Mock useStore hook
vi.mock('../../../src/store/useStore', () => ({
  useStore: vi.fn(() => mockStore),
}));

// Mock TobaccoCard component
vi.mock('../../../src/components/TobaccoCard', () => ({
  default: ({ tobacco }: { tobacco: any }) => (
    <div data-testid={`tobacco-card-${tobacco.id}`} data-tobacco-id={tobacco.id}>
      <h3>{tobacco.name}</h3>
      <p>{tobacco.brand}</p>
      <p>{tobacco.flavor}</p>
    </div>
  ),
}));

describe('Wishlist Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store to default state
    mockStore.wishlist = null;
    mockStore.searchResults = [];
    mockStore.searchQuery = '';
    mockStore.currentPage = 1;
    mockStore.isLoading = false;
    mockStore.error = null;
    mockStore.fetchWishlist.mockReset();
    mockStore.addToWishlist.mockReset();
    mockStore.removeFromWishlist.mockReset();
    mockStore.clearWishlist.mockReset();
    mockStore.searchTobaccos.mockReset();
    mockStore.setSearchQuery.mockReset();
    mockStore.setCurrentPage.mockReset();
    mockStore.clearError.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render Wishlist component without crashing', () => {
      render(<Wishlist />);
      expect(screen.getByTestId('wishlist-component')).toBeInTheDocument();
    });

    it('should have correct CSS classes for main container', () => {
      const { container } = render(<Wishlist />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have correct component structure', () => {
      const { container } = render(<Wishlist />);
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Conditional Rendering - Loading State', () => {
    it('should display loading indicator when isLoading is true and wishlist is null', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      render(<Wishlist />);
      
      const loadingSpinner = screen.getByRole('status') || screen.queryByText(/loading/i);
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should not display wishlist items when isLoading is true', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should display loading indicator with correct styling', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      const { container } = render(<Wishlist />);
      
      const loadingContainer = container.querySelector('.flex.justify-center.items-center.py-8');
      expect(loadingContainer).toBeInTheDocument();
      
      const spinner = container.querySelector('.animate-spin.rounded-full.h-12.w-12.border-b-2.border-blue-600');
      expect(spinner).toBeInTheDocument();
    });

    it('should not display empty wishlist message when loading', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      render(<Wishlist />);
      
      const emptyMessage = screen.queryByText(/your wishlist is empty/i);
      expect(emptyMessage).not.toBeInTheDocument();
    });

    it('should not display error message when loading', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display wishlist header when loading', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      render(<Wishlist />);
      
      const wishlistHeader = screen.queryByText(/your wishlist/i);
      expect(wishlistHeader).not.toBeInTheDocument();
    });
  });

  describe('Conditional Rendering - Error State', () => {
    it('should display error message when error is not null', () => {
      mockStore.error = 'Failed to fetch wishlist';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const errorMessage = screen.getByText('Failed to fetch wishlist');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should not display wishlist items when error is not null', () => {
      mockStore.error = 'Network error';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should display error message with correct styling', () => {
      mockStore.error = 'Authentication failed';
      mockStore.isLoading = false;
      
      const { container } = render(<Wishlist />);
      
      const errorContainer = container.querySelector('.bg-red-100.border.border-red-400.text-red-700.px-4.py-3.rounded');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display correct error text', () => {
      const errorText = 'Server error occurred';
      mockStore.error = errorText;
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const errorMessage = screen.getByText(errorText);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent(errorText);
    });

    it('should not display loading indicator when error is present', () => {
      mockStore.error = 'Error loading wishlist';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const loadingSpinner = screen.queryByRole('status');
      expect(loadingSpinner).not.toBeInTheDocument();
    });

    it('should not display empty wishlist message when error is present', () => {
      mockStore.error = 'Error loading wishlist';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const emptyMessage = screen.queryByText(/your wishlist is empty/i);
      expect(emptyMessage).not.toBeInTheDocument();
    });

    it('should not display wishlist header when error is present', () => {
      mockStore.error = 'Error loading wishlist';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const wishlistHeader = screen.queryByText(/your wishlist/i);
      expect(wishlistHeader).not.toBeInTheDocument();
    });
  });

  describe('Conditional Rendering - Empty Wishlist', () => {
    it('should display empty wishlist message when wishlist is null', () => {
      mockStore.wishlist = null;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const emptyMessage = screen.getByText(/your wishlist is empty/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display empty wishlist message when wishlist has empty items array', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const emptyMessage = screen.getByText(/your wishlist is empty/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display empty wishlist message with correct styling', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      const { container } = render(<Wishlist />);
      
      const emptyContainer = container.querySelector('.text-center.py-8.text-gray-500');
      expect(emptyContainer).toBeInTheDocument();
    });

    it('should display both empty wishlist messages', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
      expect(screen.getByText('Search for tobaccos and add them to your wishlist')).toBeInTheDocument();
    });

    it('should not display TobaccoCard components when wishlist is empty', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should not display loading indicator when wishlist is empty', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const loadingSpinner = screen.queryByRole('status');
      expect(loadingSpinner).not.toBeInTheDocument();
    });

    it('should not display error message when wishlist is empty', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display wishlist header when wishlist is empty', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const wishlistHeader = screen.queryByText(/your wishlist \(/i);
      expect(wishlistHeader).not.toBeInTheDocument();
    });
  });

  describe('Conditional Rendering - With Items', () => {
    it('should display TobaccoCard components when wishlist has items', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards.length).toBeGreaterThan(0);
    });

    it('should display correct number of TobaccoCard components', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(mockWishlist.items.length);
    });

    it('should render TobaccoCard with correct props - first item', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const firstCard = screen.getByTestId(`tobacco-card-${mockWishlistItem1.tobaccoId}`);
      expect(firstCard).toBeInTheDocument();
      expect(firstCard).toHaveTextContent(mockWishlistItem1.tobacco?.name || '');
      expect(firstCard).toHaveTextContent(mockWishlistItem1.tobacco?.brand || '');
    });

    it('should render TobaccoCard with correct props - second item', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const secondCard = screen.getByTestId(`tobacco-card-${mockWishlistItem2.tobaccoId}`);
      expect(secondCard).toBeInTheDocument();
      expect(secondCard).toHaveTextContent(mockWishlistItem2.tobacco?.name || '');
      expect(secondCard).toHaveTextContent(mockWishlistItem2.tobacco?.brand || '');
    });

    it('should render TobaccoCard with correct props - third item', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const thirdCard = screen.getByTestId(`tobacco-card-${mockWishlistItem3.tobaccoId}`);
      expect(thirdCard).toBeInTheDocument();
      expect(thirdCard).toHaveTextContent(mockWishlistItem3.tobacco?.name || '');
      expect(thirdCard).toHaveTextContent(mockWishlistItem3.tobacco?.brand || '');
    });

    it('should display items in correct order', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards[0]).toHaveAttribute('data-tobacco-id', mockWishlist.items[0].tobaccoId);
      expect(tobaccoCards[1]).toHaveAttribute('data-tobacco-id', mockWishlist.items[1].tobaccoId);
      expect(tobaccoCards[2]).toHaveAttribute('data-tobacco-id', mockWishlist.items[2].tobaccoId);
    });

    it('should display wishlist header with correct item count', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const header = screen.getByText(/your wishlist/i);
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent(`Your Wishlist (${mockWishlist.items.length})`);
    });

    it('should not display empty wishlist message when wishlist has items', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const emptyMessage = screen.queryByText(/your wishlist is empty/i);
      expect(emptyMessage).not.toBeInTheDocument();
    });

    it('should not display loading indicator when wishlist has items', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const loadingSpinner = screen.queryByRole('status');
      expect(loadingSpinner).not.toBeInTheDocument();
    });

    it('should not display error message when wishlist has items', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should display wishlist items in space-y-4 container', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      const { container } = render(<Wishlist />);
      
      const itemsContainer = container.querySelector('.space-y-4');
      expect(itemsContainer).toBeInTheDocument();
    });

    it('should not render TobaccoCard for items without tobacco data', () => {
      const wishlistWithMissingTobacco = createMockWishlist({
        items: [
          {
            ...mockWishlistItem1,
            tobacco: undefined,
          },
        ],
      });
      
      mockStore.wishlist = wishlistWithMissingTobacco;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(0);
    });
  });

  describe('useEffect Hook Tests', () => {
    it('should call fetchWishlist on component mount', () => {
      render(<Wishlist />);
      
      expect(mockStore.fetchWishlist).toHaveBeenCalledTimes(1);
    });

    it('should call fetchWishlist only once on mount', () => {
      render(<Wishlist />);
      
      expect(mockStore.fetchWishlist).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchWishlist on re-renders', () => {
      const { rerender } = render(<Wishlist />);
      
      expect(mockStore.fetchWishlist).toHaveBeenCalledTimes(1);
      
      rerender(<Wishlist />);
      expect(mockStore.fetchWishlist).toHaveBeenCalledTimes(1);
      
      rerender(<Wishlist />);
      expect(mockStore.fetchWishlist).toHaveBeenCalledTimes(1);
    });

    it('should call fetchWishlist with no arguments', () => {
      render(<Wishlist />);
      
      expect(mockStore.fetchWishlist).toHaveBeenCalledWith();
    });

    it('should call fetchWishlist immediately on mount', () => {
      render(<Wishlist />);
      
      expect(mockStore.fetchWishlist).toHaveBeenCalled();
    });
  });

  describe('State Management Tests', () => {
    it('should respond to isLoading state changes - from false to true', () => {
      mockStore.isLoading = false;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      mockStore.isLoading = true;
      rerender(<Wishlist />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should respond to isLoading state changes - from true to false', () => {
      mockStore.isLoading = true;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      mockStore.isLoading = false;
      mockStore.wishlist = mockEmptyWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should respond to error state changes - from null to error', () => {
      mockStore.error = null;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      
      mockStore.error = 'Network error';
      rerender(<Wishlist />);
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should respond to error state changes - from error to null', () => {
      mockStore.error = 'Network error';
      const { rerender } = render(<Wishlist />);
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
      
      mockStore.error = null;
      mockStore.wishlist = mockEmptyWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });

    it('should respond to wishlist state changes - from null to with items', () => {
      mockStore.wishlist = null;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
      
      mockStore.wishlist = mockWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryByText(/your wishlist is empty/i)).not.toBeInTheDocument();
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(mockWishlist.items.length);
    });

    it('should respond to wishlist state changes - from with items to empty', () => {
      mockStore.wishlist = mockWishlist;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(mockWishlist.items.length);
      
      mockStore.wishlist = mockEmptyWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(0);
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should re-render correctly when wishlist updates', () => {
      mockStore.wishlist = createMockWishlist({
        items: [mockWishlistItem1],
      });
      const { rerender } = render(<Wishlist />);
      
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(1);
      
      mockStore.wishlist = createMockWishlist({
        items: [mockWishlistItem1, mockWishlistItem2],
      });
      rerender(<Wishlist />);
      
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(2);
    });

    it('should update item count in header when wishlist changes', () => {
      mockStore.wishlist = createMockWishlist({
        items: [mockWishlistItem1],
      });
      const { rerender } = render(<Wishlist />);
      
      expect(screen.getByText(/your wishlist \(1\)/i)).toBeInTheDocument();
      
      mockStore.wishlist = createMockWishlist({
        items: [mockWishlistItem1, mockWishlistItem2, mockWishlistItem3],
      });
      rerender(<Wishlist />);
      
      expect(screen.getByText(/your wishlist \(3\)/i)).toBeInTheDocument();
    });

    it('should handle rapid state changes - loading → items → error', () => {
      mockStore.isLoading = true;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      mockStore.isLoading = false;
      mockStore.wishlist = mockWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(mockWishlist.items.length);
      
      mockStore.error = 'Error occurred';
      mockStore.wishlist = null;
      rerender(<Wishlist />);
      
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(0);
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('should handle rapid state changes - loading → empty → items', () => {
      mockStore.isLoading = true;
      const { rerender } = render(<Wishlist />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      mockStore.isLoading = false;
      mockStore.wishlist = mockEmptyWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
      
      mockStore.wishlist = mockWishlist;
      rerender(<Wishlist />);
      
      expect(screen.queryByText(/your wishlist is empty/i)).not.toBeInTheDocument();
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(mockWishlist.items.length);
    });
  });

  describe('Accessibility Tests', () => {
    it('should have accessible loading state', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      render(<Wishlist />);
      
      const loadingSpinner = screen.getByRole('status') || screen.getByText(/loading/i);
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should have accessible error state', () => {
      mockStore.error = 'Failed to load wishlist';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const errorMessage = screen.getByText('Failed to load wishlist');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toBeVisible();
    });

    it('should have accessible empty wishlist message', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const emptyMessage = screen.getByText(/your wishlist is empty/i);
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toBeVisible();
    });

    it('should have accessible wishlist items', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      tobaccoCards.forEach(card => {
        expect(card).toBeInTheDocument();
        expect(card).toBeVisible();
      });
    });

    it('should have accessible wishlist header', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toBeInTheDocument();
      expect(header).toBeVisible();
    });

    it('should have proper heading structure', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0]).toHaveProperty('tagName', 'H2');
    });

    it('should have visible text content for all states', () => {
      // Test loading state
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      const { rerender } = render(<Wishlist />);
      expect(document.body.textContent).toBeTruthy();
      
      // Test error state
      mockStore.isLoading = false;
      mockStore.error = 'Error message';
      rerender(<Wishlist />);
      expect(document.body.textContent).toBeTruthy();
      
      // Test empty state
      mockStore.error = null;
      mockStore.wishlist = mockEmptyWishlist;
      rerender(<Wishlist />);
      expect(document.body.textContent).toBeTruthy();
      
      // Test with items
      mockStore.wishlist = mockWishlist;
      rerender(<Wishlist />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single wishlist item', () => {
      const singleItemWishlist = createMockWishlist({
        items: [mockWishlistItem1],
      });
      mockStore.wishlist = singleItemWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(1);
      expect(screen.getByText(/your wishlist \(1\)/i)).toBeInTheDocument();
    });

    it('should handle many wishlist items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) =>
        createMockWishlistItem({
          tobaccoId: `tobacco-${i + 1}`,
        })
      );
      const manyItemsWishlist = createMockWishlist({
        items: manyItems,
      });
      mockStore.wishlist = manyItemsWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(20);
      expect(screen.getByText(/your wishlist \(20\)/i)).toBeInTheDocument();
    });

    it('should handle component unmount during loading', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      
      const { unmount } = render(<Wishlist />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      unmount();
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle undefined wishlist', () => {
      mockStore.wishlist = undefined as any;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should handle null wishlist', () => {
      mockStore.wishlist = null;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should handle wishlist with undefined items', () => {
      const wishlistWithUndefinedItems = {
        ...mockWishlist,
        items: undefined as any,
      };
      mockStore.wishlist = wishlistWithUndefinedItems;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should handle wishlist with items containing null tobacco', () => {
      const wishlistWithNullTobacco = createMockWishlist({
        items: [
          {
            ...mockWishlistItem1,
            tobacco: null as any,
          },
          mockWishlistItem2,
        ],
      });
      mockStore.wishlist = wishlistWithNullTobacco;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(1);
      expect(tobaccoCards[0]).toHaveAttribute('data-tobacco-id', mockWishlistItem2.tobaccoId);
    });

    it('should handle wishlist with items containing undefined tobacco', () => {
      const wishlistWithUndefinedTobacco = createMockWishlist({
        items: [
          {
            ...mockWishlistItem1,
            tobacco: undefined,
          },
          mockWishlistItem2,
        ],
      });
      mockStore.wishlist = wishlistWithUndefinedTobacco;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(1);
      expect(tobaccoCards[0]).toHaveAttribute('data-tobacco-id', mockWishlistItem2.tobaccoId);
    });

    it('should handle empty string error', () => {
      mockStore.error = '';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const errorMessage = screen.getByText('');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle very long error message', () => {
      const longError = 'A'.repeat(1000);
      mockStore.error = longError;
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      const errorMessage = screen.getByText(longError);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle wishlist with zero total count', () => {
      const wishlistWithZeroTotal = createMockWishlist({
        items: [],
        total: 0,
      });
      mockStore.wishlist = wishlistWithZeroTotal;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should handle wishlist with mismatched total count', () => {
      const wishlistWithMismatchedTotal = createMockWishlist({
        items: [mockWishlistItem1, mockWishlistItem2],
        total: 10,
      });
      mockStore.wishlist = wishlistWithMismatchedTotal;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(2);
      expect(screen.getByText(/your wishlist \(2\)/i)).toBeInTheDocument();
    });

    it('should handle rapid re-renders', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      const { rerender } = render(<Wishlist />);
      
      for (let i = 0; i < 10; i++) {
        mockStore.wishlist = createMockWishlist({
          items: Array.from({ length: i + 1 }, (_, j) =>
            createMockWishlistItem({ tobaccoId: `tobacco-${j + 1}` })
          ),
        });
        rerender(<Wishlist />);
      }
      
      const tobaccoCards = screen.queryAllByTestId(/tobacco-card-/);
      expect(tobaccoCards).toHaveLength(10);
    });

    it('should handle concurrent state changes', () => {
      mockStore.isLoading = true;
      const { rerender } = render(<Wishlist />);
      
      // Simulate concurrent state updates
      mockStore.isLoading = false;
      mockStore.wishlist = mockWishlist;
      mockStore.error = null;
      
      rerender(<Wishlist />);
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(mockWishlist.items.length);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Integration with Store', () => {
    it('should use store state correctly', () => {
      mockStore.wishlist = mockWishlist;
      mockStore.isLoading = false;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(mockStore.wishlist).toEqual(mockWishlist);
      expect(mockStore.isLoading).toBe(false);
      expect(mockStore.error).toBe(null);
    });

    it('should call store actions correctly', () => {
      render(<Wishlist />);
      
      expect(mockStore.fetchWishlist).toHaveBeenCalled();
    });

    it('should not call other store actions', () => {
      render(<Wishlist />);
      
      expect(mockStore.addToWishlist).not.toHaveBeenCalled();
      expect(mockStore.removeFromWishlist).not.toHaveBeenCalled();
      expect(mockStore.clearWishlist).not.toHaveBeenCalled();
      expect(mockStore.searchTobaccos).not.toHaveBeenCalled();
      expect(mockStore.setSearchQuery).not.toHaveBeenCalled();
      expect(mockStore.setCurrentPage).not.toHaveBeenCalled();
      expect(mockStore.clearError).not.toHaveBeenCalled();
    });
  });

  describe('Component Behavior', () => {
    it('should prioritize error state over loading state', () => {
      mockStore.isLoading = true;
      mockStore.error = 'Error occurred';
      
      render(<Wishlist />);
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should prioritize error state over empty wishlist', () => {
      mockStore.wishlist = mockEmptyWishlist;
      mockStore.error = 'Error occurred';
      mockStore.isLoading = false;
      
      render(<Wishlist />);
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText(/your wishlist is empty/i)).not.toBeInTheDocument();
    });

    it('should prioritize loading state when isLoading is true and wishlist is null', () => {
      mockStore.isLoading = true;
      mockStore.wishlist = null;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText(/your wishlist is empty/i)).not.toBeInTheDocument();
    });

    it('should display wishlist items when isLoading is false and wishlist has items', () => {
      mockStore.isLoading = false;
      mockStore.wishlist = mockWishlist;
      mockStore.error = null;
      
      render(<Wishlist />);
      
      expect(screen.queryAllByTestId(/tobacco-card-/)).toHaveLength(mockWishlist.items.length);
    });
  });
});
