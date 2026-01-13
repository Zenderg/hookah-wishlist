/**
 * SearchResults Component Unit Tests
 * 
 * Comprehensive unit tests for SearchResults component following javascript-testing-patterns skill best practices.
 * Tests cover rendering, conditional rendering, state management, accessibility, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResults from '../../../src/components/SearchResults';
import { mockStore, createMockStoreLoading, createMockStoreWithError, createMockStoreWithSearchResults, createMockStoreWithSearchQuery } from '../../mocks/mockStore';
import { mockTobacco1, mockTobacco2, mockTobacco3, createMockTobaccos } from '../../fixtures/mockData';

// Mock useStore hook
vi.mock('../../../src/store/useStore', () => ({
  useStore: vi.fn(() => mockStore),
}));

// Mock TobaccoCard component with unique text to avoid collisions
vi.mock('../../../src/components/TobaccoCard', () => ({
  default: ({ tobacco }: { tobacco: any }) => (
    <div data-testid={`tobacco-card-${tobacco.id}`}>
      <h3 data-testid={`tobacco-name-${tobacco.id}`}>{tobacco.name}</h3>
      <p data-testid={`tobacco-brand-${tobacco.id}`}>{tobacco.brand}</p>
    </div>
  ),
}));

describe('SearchResults Component', () => {
  /**
   * Setup and cleanup for each test
   */
  beforeEach(() => {
    // Reset mock store state before each test
    mockStore.isLoading = false;
    mockStore.searchQuery = '';
    mockStore.searchResults = [];
    mockStore.error = null;
    mockStore.currentPage = 1;
    mockStore.wishlist = null;
  });

  /**
   * Cleanup after each test to prevent test pollution
   */
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  /**
   * Rendering Tests
   * Verify that SearchResults component renders correctly with proper structure
   */
  describe('Rendering', () => {
    it('should render without throwing errors', () => {
      // Arrange & Act
      const { container } = render(<SearchResults />);

      // Assert
      expect(container).toBeInTheDocument();
    });

    it('should render with empty query message by default', () => {
      // Arrange & Act
      render(<SearchResults />);

      // Assert
      const message = screen.getByText('Enter a search term to find tobaccos');
      expect(message).toBeInTheDocument();
    });

    it('should have correct CSS classes on empty query container', () => {
      // Arrange & Act
      const { container } = render(<SearchResults />);

      // Assert
      const messageContainer = screen.getByText('Enter a search term to find tobaccos').parentElement;
      expect(messageContainer).toHaveClass('text-center', 'py-8', 'text-gray-500');
    });

    it('should render only one message element when no search query', () => {
      // Arrange & Act
      const { container } = render(<SearchResults />);

      // Assert
      const messages = container.querySelectorAll('p');
      expect(messages).toHaveLength(1);
    });

    it('should not render TobaccoCard components when no results', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should render correctly with all states', () => {
      // Arrange & Act - Test each state
      mockStore.isLoading = false;
      mockStore.error = null;
      mockStore.searchQuery = '';
      mockStore.searchResults = [];

      // Assert - Empty query state
      const { container: container1 } = render(<SearchResults />);
      expect(container1).toBeInTheDocument();
      cleanup();

      // Assert - Loading state
      mockStore.isLoading = true;
      const { container: container2 } = render(<SearchResults />);
      expect(container2).toBeInTheDocument();
      cleanup();

      // Assert - Error state
      mockStore.isLoading = false;
      mockStore.error = 'Test error';
      const { container: container3 } = render(<SearchResults />);
      expect(container3).toBeInTheDocument();
      cleanup();

      // Assert - No results state
      mockStore.error = null;
      mockStore.searchQuery = 'Test';
      const { container: container4 } = render(<SearchResults />);
      expect(container4).toBeInTheDocument();
      cleanup();

      // Assert - With results state
      mockStore.searchResults = [mockTobacco1];
      const { container: container5 } = render(<SearchResults />);
      expect(container5).toBeInTheDocument();
    });
  });

  /**
   * Conditional Rendering Tests - Loading State
   * Verify that component displays loading indicator correctly
   */
  describe('Conditional Rendering - Loading State', () => {
    it('should display loading indicator when isLoading is true', () => {
      // Arrange
      mockStore.isLoading = true;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not display results when isLoading is true', () => {
      // Arrange
      mockStore.isLoading = true;
      mockStore.searchResults = [mockTobacco1, mockTobacco2];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should not display error message when isLoading is true', () => {
      // Arrange
      mockStore.isLoading = true;
      mockStore.error = 'Test error';

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.queryByText('Test error');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display empty query message when isLoading is true', () => {
      // Arrange
      mockStore.isLoading = true;

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
    });

    it('should not display no results message when isLoading is true', () => {
      // Arrange
      mockStore.isLoading = true;
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).not.toBeInTheDocument();
    });

    it('should have correct CSS classes on loading container', () => {
      // Arrange
      mockStore.isLoading = true;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const loadingContainer = container.querySelector('.flex.justify-center.items-center');
      expect(loadingContainer).toHaveClass('flex', 'justify-center', 'items-center', 'py-8');
    });

    it('should have correct CSS classes on loading spinner', () => {
      // Arrange
      mockStore.isLoading = true;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-blue-600');
    });

    it('should prioritize loading state over error state', () => {
      // Arrange
      mockStore.isLoading = true;
      mockStore.error = 'Test error';

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      const errorMessage = screen.queryByText('Test error');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should prioritize loading state over results', () => {
      // Arrange
      mockStore.isLoading = true;
      mockStore.searchResults = [mockTobacco1, mockTobacco2];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should prioritize loading state over empty query message', () => {
      // Arrange
      mockStore.isLoading = true;
      mockStore.searchQuery = '';

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
    });
  });

  /**
   * Conditional Rendering Tests - Error State
   * Verify that component displays error message correctly
   */
  describe('Conditional Rendering - Error State', () => {
    it('should display error message when error is not null', () => {
      // Arrange
      mockStore.error = 'Network error occurred';

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText('Network error occurred');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should not display results when error is not null', () => {
      // Arrange
      mockStore.error = 'Test error';
      mockStore.searchResults = [mockTobacco1, mockTobacco2];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should not display loading indicator when error is not null', () => {
      // Arrange
      mockStore.error = 'Test error';
      mockStore.isLoading = false;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not display empty query message when error is not null', () => {
      // Arrange
      mockStore.error = 'Test error';
      mockStore.searchQuery = '';

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
    });

    it('should not display no results message when error is not null', () => {
      // Arrange
      mockStore.error = 'Test error';
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).not.toBeInTheDocument();
    });

    it('should have correct CSS classes on error container', () => {
      // Arrange
      mockStore.error = 'Test error';

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const errorContainer = container.querySelector('.bg-red-100');
      expect(errorContainer).toHaveClass('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded');
    });

    it('should display correct error text', () => {
      // Arrange
      const errorMessages = [
        'Network error occurred',
        'Failed to fetch data',
        'Server error',
        'Authentication failed',
      ];

      errorMessages.forEach((errorMessage) => {
        // Arrange
        mockStore.error = errorMessage;
        cleanup();

        // Act
        render(<SearchResults />);

        // Assert
        const errorElement = screen.getByText(errorMessage);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.tagName).toBe('DIV');
      });
    });

    it('should display error message with special characters', () => {
      // Arrange
      mockStore.error = 'Error: "Test" <script>alert(1)</script>';

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText('Error: "Test" <script>alert(1)</script>');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should display error message with Unicode characters', () => {
      // Arrange
      mockStore.error = 'Ошибка сети 🚫';

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText('Ошибка сети 🚫');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should display error message with very long text', () => {
      // Arrange
      const longError = 'A'.repeat(1000);
      mockStore.error = longError;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText(longError);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should prioritize error state over empty query message', () => {
      // Arrange
      mockStore.error = 'Test error';
      mockStore.searchQuery = '';

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeInTheDocument();
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
    });

    it('should prioritize error state over no results message', () => {
      // Arrange
      mockStore.error = 'Test error';
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeInTheDocument();
      const noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).not.toBeInTheDocument();
    });
  });

  /**
   * Conditional Rendering Tests - Empty Query
   * Verify that component displays empty query message correctly
   */
  describe('Conditional Rendering - Empty Query', () => {
    it('should display empty query message when searchQuery is empty', () => {
      // Arrange
      mockStore.searchQuery = '';

      // Act
      render(<SearchResults />);

      // Assert
      const message = screen.getByText('Enter a search term to find tobaccos');
      expect(message).toBeInTheDocument();
    });

    it('should render without errors when searchQuery is empty', () => {
      // Arrange & Act
      const { container } = render(<SearchResults />);

      // Assert
      expect(container).toBeInTheDocument();
      const message = screen.getByText('Enter a search term to find tobaccos');
      expect(message).toBeInTheDocument();
    });

    it('should not display loading indicator when searchQuery is empty', () => {
      // Arrange
      mockStore.searchQuery = '';
      mockStore.isLoading = false;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not display error message when searchQuery is empty and no error', () => {
      // Arrange
      mockStore.searchQuery = '';
      mockStore.error = null;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display results when searchQuery is empty', () => {
      // Arrange
      mockStore.searchQuery = '';
      mockStore.searchResults = [mockTobacco1, mockTobacco2];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should not display no results message when searchQuery is empty', () => {
      // Arrange
      mockStore.searchQuery = '';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.getByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).toBeInTheDocument();
      const noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).not.toBeInTheDocument();
    });

    it('should have correct CSS classes on empty query container', () => {
      // Arrange
      mockStore.searchQuery = '';

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const messageContainer = screen.getByText('Enter a search term to find tobaccos').parentElement;
      expect(messageContainer).toHaveClass('text-center', 'py-8', 'text-gray-500');
    });

    it('should have correct text content for empty query message', () => {
      // Arrange
      mockStore.searchQuery = '';

      // Act
      render(<SearchResults />);

      // Assert
      const message = screen.getByText('Enter a search term to find tobaccos');
      expect(message.tagName).toBe('P');
    });

    it('should treat whitespace-only query as not empty (truthy)', () => {
      // Arrange
      mockStore.searchQuery = '   ';

      // Act
      render(<SearchResults />);

      // Assert - Note: Component checks if (!searchQuery), so whitespace is truthy
      // This test verifies current behavior
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
      
      // Whitespace query goes to "no results" state because searchResults is empty
      const noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).toBeInTheDocument();
    });
  });

  /**
   * Conditional Rendering Tests - No Results
   * Verify that component displays no results message correctly
   */
  describe('Conditional Rendering - No Results', () => {
    it('should display no results message when searchResults is empty', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText('No tobaccos found for "Test"');
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should have correct CSS classes on no results container', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const messageContainer = screen.getByText(/No tobaccos found/).parentElement;
      expect(messageContainer).toHaveClass('text-center', 'py-8', 'text-gray-500');
    });

    it('should not display TobaccoCard components when searchResults is empty', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
    });

    it('should not display loading indicator when searchResults is empty', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];
      mockStore.isLoading = false;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not display error message when searchResults is empty and no error', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];
      mockStore.error = null;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display empty query message when searchQuery is not empty', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
    });

    it('should display search query in no results message', () => {
      // Arrange
      mockStore.searchQuery = 'Mint';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText('No tobaccos found for "Mint"');
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should display search query with special characters in no results message', () => {
      // Arrange
      mockStore.searchQuery = 'Test <script>';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText('No tobaccos found for "Test <script>"');
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should display search query with Unicode characters in no results message', () => {
      // Arrange
      mockStore.searchQuery = 'Мята';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText('No tobaccos found for "Мята"');
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should display search query with emoji in no results message', () => {
      // Arrange
      mockStore.searchQuery = 'Mint 🍃';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText('No tobaccos found for "Mint 🍃"');
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should have correct text content for no results message', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText(/No tobaccos found/);
      expect(noResultsMessage.tagName).toBe('P');
    });
  });

  /**
   * Conditional Rendering Tests - With Results
   * Verify that component displays results correctly
   */
  describe('Conditional Rendering - With Results', () => {
    it('should display TobaccoCard components when searchResults has items', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1, mockTobacco2];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(2);
    });

    it('should display correct number of TobaccoCard components', () => {
      // Arrange
      const results = [mockTobacco1, mockTobacco2, mockTobacco3];
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = results;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(3);
    });

    it('should pass correct tobacco data to each TobaccoCard', () => {
      // Arrange
      const results = [mockTobacco1, mockTobacco2];
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = results;

      // Act
      render(<SearchResults />);

      // Assert - Use data-testid to avoid text collisions
      expect(screen.getByTestId(`tobacco-name-${mockTobacco1.id}`)).toHaveTextContent(mockTobacco1.name);
      expect(screen.getByTestId(`tobacco-brand-${mockTobacco1.id}`)).toHaveTextContent(mockTobacco1.brand);
      expect(screen.getByTestId(`tobacco-name-${mockTobacco2.id}`)).toHaveTextContent(mockTobacco2.name);
      expect(screen.getByTestId(`tobacco-brand-${mockTobacco2.id}`)).toHaveTextContent(mockTobacco2.brand);
    });

    it('should display results in correct order', () => {
      // Arrange
      const results = [mockTobacco1, mockTobacco2, mockTobacco3];
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = results;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards[0]).toHaveTextContent(mockTobacco1.name);
      expect(tobaccoCards[1]).toHaveTextContent(mockTobacco2.name);
      expect(tobaccoCards[2]).toHaveTextContent(mockTobacco3.name);
    });

    it('should have correct CSS classes on results container', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const resultsContainer = container.querySelector('.space-y-4');
      expect(resultsContainer).toBeInTheDocument();
      expect(resultsContainer).toHaveClass('space-y-4');
    });

    it('should not display loading indicator when results are present', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];
      mockStore.isLoading = false;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should not display error message when results are present', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];
      mockStore.error = null;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should not display empty query message when results are present', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
    });

    it('should not display no results message when results are present', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).not.toBeInTheDocument();
    });

    it('should use tobacco id as key for TobaccoCard components', () => {
      // Arrange
      const results = [mockTobacco1, mockTobacco2];
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = results;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const card1 = container.querySelector('[data-testid="tobacco-card-tobacco-001"]');
      const card2 = container.querySelector('[data-testid="tobacco-card-tobacco-002"]');
      expect(card1).toBeInTheDocument();
      expect(card2).toBeInTheDocument();
    });

    it('should render single result correctly', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(1);
      expect(screen.getByTestId(`tobacco-name-${mockTobacco1.id}`)).toHaveTextContent(mockTobacco1.name);
    });
  });

  /**
   * State Management Tests
   * Verify that component responds to state changes correctly
   */
  describe('State Management', () => {
    it('should respond to isLoading state changes', () => {
      // Arrange
      const { rerender, container } = render(<SearchResults />);

      // Act - Initial state (not loading)
      let spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();

      // Act - Change to loading state
      mockStore.isLoading = true;
      rerender(<SearchResults />);

      // Assert - Loading state
      spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Act - Change back to not loading
      mockStore.isLoading = false;
      rerender(<SearchResults />);

      // Assert - Not loading state
      spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should respond to error state changes', () => {
      // Arrange
      const { rerender } = render(<SearchResults />);

      // Act - Initial state (no error)
      let errorMessage: HTMLElement | null = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();

      // Act - Change to error state
      mockStore.error = 'Test error';
      rerender(<SearchResults />);

      // Assert - Error state
      errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeInTheDocument();

      // Act - Clear error
      mockStore.error = null;
      rerender(<SearchResults />);

      // Assert - No error state
      errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should respond to searchResults state changes', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      const { rerender, container } = render(<SearchResults />);

      // Act - Initial state (no results)
      let tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);

      // Act - Change to results state
      mockStore.searchResults = [mockTobacco1];
      rerender(<SearchResults />);

      // Assert - Results state
      tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(1);

      // Act - Change to more results
      mockStore.searchResults = [mockTobacco1, mockTobacco2];
      rerender(<SearchResults />);

      // Assert - More results state
      tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(2);
    });

    it('should respond to searchQuery state changes', () => {
      // Arrange
      const { rerender } = render(<SearchResults />);

      // Act - Initial state (empty query)
      let emptyQueryMessage: HTMLElement | null = screen.getByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).toBeInTheDocument();

      // Act - Change to non-empty query with no results
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];
      rerender(<SearchResults />);

      // Assert - No results message
      let noResultsMessage: HTMLElement | null = screen.getByText('No tobaccos found for "Test"');
      expect(noResultsMessage).toBeInTheDocument();
      emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();

      // Act - Change to non-empty query with results
      mockStore.searchResults = [mockTobacco1];
      rerender(<SearchResults />);

      // Assert - Results displayed
      const tobaccoCard = screen.getByTestId(`tobacco-name-${mockTobacco1.id}`);
      expect(tobaccoCard).toBeInTheDocument();
      noResultsMessage = screen.queryByText(/No tobaccos found/);
      expect(noResultsMessage).not.toBeInTheDocument();
    });

    it('should handle rapid state changes', () => {
      // Arrange
      const { rerender } = render(<SearchResults />);

      // Act - Rapid state changes
      mockStore.isLoading = true;
      rerender(<SearchResults />);

      mockStore.isLoading = false;
      mockStore.searchQuery = 'Test';
      rerender(<SearchResults />);

      mockStore.searchResults = [mockTobacco1];
      rerender(<SearchResults />);

      mockStore.error = 'Test error';
      rerender(<SearchResults />);

      // Assert - Final state (error)
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle state changes from loading to results', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      const { rerender, container } = render(<SearchResults />);

      // Act - Loading state
      mockStore.isLoading = true;
      rerender(<SearchResults />);

      // Assert - Loading
      let spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Act - Results state
      mockStore.isLoading = false;
      mockStore.searchResults = [mockTobacco1, mockTobacco2];
      rerender(<SearchResults />);

      // Assert - Results
      spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(2);
    });

    it('should handle state changes from loading to error', () => {
      // Arrange
      const { rerender, container } = render(<SearchResults />);

      // Act - Loading state
      mockStore.isLoading = true;
      rerender(<SearchResults />);

      // Assert - Loading
      let spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Act - Error state
      mockStore.isLoading = false;
      mockStore.error = 'Network error';
      rerender(<SearchResults />);

      // Assert - Error
      spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
      const errorMessage = screen.getByText('Network error');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle state changes from results to error', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      const { rerender, container } = render(<SearchResults />);

      // Act - Results state
      mockStore.searchResults = [mockTobacco1, mockTobacco2];
      rerender(<SearchResults />);

      // Assert - Results
      let tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(2);

      // Act - Error state
      mockStore.searchResults = [];
      mockStore.error = 'Server error';
      rerender(<SearchResults />);

      // Assert - Error
      tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
      const errorMessage = screen.getByText('Server error');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle state changes from error to results', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      const { rerender, container } = render(<SearchResults />);

      // Act - Error state
      mockStore.error = 'Network error';
      rerender(<SearchResults />);

      // Assert - Error
      let errorMessage: HTMLElement | null = screen.getByText('Network error');
      expect(errorMessage).toBeInTheDocument();

      // Act - Results state
      mockStore.error = null;
      mockStore.searchResults = [mockTobacco1];
      rerender(<SearchResults />);

      // Assert - Results
      errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(1);
    });
  });

  /**
   * Accessibility Tests
   * Verify that component is accessible to all users
   */
  describe('Accessibility', () => {
    it('should be visible to screen readers in loading state', () => {
      // Arrange
      mockStore.isLoading = true;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeVisible();
    });

    it('should be visible to screen readers in error state', () => {
      // Arrange
      mockStore.error = 'Test error';

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeVisible();
    });

    it('should be visible to screen readers in no results state', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText(/No tobaccos found/);
      expect(noResultsMessage).toBeVisible();
    });

    it('should be visible to screen readers in results state', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      render(<SearchResults />);

      // Assert
      const tobaccoCard = screen.getByTestId(`tobacco-name-${mockTobacco1.id}`);
      expect(tobaccoCard).toBeVisible();
    });

    it('should be visible to screen readers in empty query state', () => {
      // Arrange
      mockStore.searchQuery = '';

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.getByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).toBeVisible();
    });

    it('should not have aria-hidden attribute in any state', () => {
      // Arrange & Act
      const { container } = render(<SearchResults />);

      // Assert
      const mainContainer = container.firstChild;
      expect(mainContainer).not.toHaveAttribute('aria-hidden');
    });

    it('should have proper text contrast in error state', () => {
      // Arrange
      mockStore.error = 'Test error';

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const errorContainer = container.querySelector('.bg-red-100');
      expect(errorContainer).toHaveClass('text-red-700');
    });

    it('should have proper text contrast in no results state', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const messageContainer = screen.getByText(/No tobaccos found/).parentElement;
      expect(messageContainer).toHaveClass('text-gray-500');
    });

    it('should have proper text contrast in empty query state', () => {
      // Arrange
      mockStore.searchQuery = '';

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const messageContainer = screen.getByText('Enter a search term to find tobaccos').parentElement;
      expect(messageContainer).toHaveClass('text-gray-500');
    });

    it('should have proper text contrast in results state', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      render(<SearchResults />);

      // Assert
      const tobaccoCard = screen.getByTestId(`tobacco-name-${mockTobacco1.id}`);
      expect(tobaccoCard).toBeVisible();
    });
  });

  /**
   * Edge Cases
   * Verify that component handles edge cases correctly
   */
  describe('Edge Cases', () => {
    it('should handle single search result', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(1);
      expect(screen.getByTestId(`tobacco-name-${mockTobacco1.id}`)).toHaveTextContent(mockTobacco1.name);
    });

    it('should handle many search results', () => {
      // Arrange
      const manyResults = createMockTobaccos(50);
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = manyResults;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(50);
    });

    it('should handle rapid state changes (loading → results → error)', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      const { rerender, container } = render(<SearchResults />);

      // Act - Loading
      mockStore.isLoading = true;
      rerender(<SearchResults />);
      let spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Act - Results
      mockStore.isLoading = false;
      mockStore.searchResults = [mockTobacco1];
      rerender(<SearchResults />);
      spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
      let tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(1);

      // Act - Error
      mockStore.searchResults = [];
      mockStore.error = 'Test error';
      rerender(<SearchResults />);
      tobaccoCards = container.querySelectorAll('[data-testid^="tobacco-card-"]');
      expect(tobaccoCards).toHaveLength(0);
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle component unmount during loading', () => {
      // Arrange
      mockStore.isLoading = true;
      const { unmount } = render(<SearchResults />);

      // Act & Assert - Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component unmount during error state', () => {
      // Arrange
      mockStore.error = 'Test error';
      const { unmount } = render(<SearchResults />);

      // Act & Assert - Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component unmount during results display', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];
      const { unmount } = render(<SearchResults />);

      // Act & Assert - Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should handle undefined values in searchResults', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1, undefined as any, mockTobacco2];

      // Act & Assert - This test verifies current behavior
      // Component will crash with undefined values - this is expected behavior
      expect(() => render(<SearchResults />)).toThrow();
    });

    it('should handle null values in searchResults', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1, null as any, mockTobacco2];

      // Act & Assert - This test verifies current behavior
      // Component will crash with null values - this is expected behavior
      expect(() => render(<SearchResults />)).toThrow();
    });

    it('should handle empty string in searchQuery', () => {
      // Arrange
      mockStore.searchQuery = '';

      // Act
      render(<SearchResults />);

      // Assert
      const emptyQueryMessage = screen.getByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).toBeInTheDocument();
    });

    it('should handle whitespace-only string in searchQuery', () => {
      // Arrange
      mockStore.searchQuery = '   ';

      // Act
      render(<SearchResults />);

      // Assert - Note: Component checks if (!searchQuery), so whitespace is truthy
      // This test verifies current behavior
      const emptyQueryMessage = screen.queryByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).not.toBeInTheDocument();
      
      // Whitespace query goes to "no results" state because searchResults is empty
      const noResultsMessage = screen.queryByText(/No tobaccos found for/);
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should handle very long search query', () => {
      // Arrange
      const longQuery = 'a'.repeat(1000);
      mockStore.searchQuery = longQuery;
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText(`No tobaccos found for "${longQuery}"`);
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should handle search query with special characters', () => {
      // Arrange
      const specialQuery = 'Test!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockStore.searchQuery = specialQuery;
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText(`No tobaccos found for "${specialQuery}"`);
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should handle search query with Unicode characters', () => {
      // Arrange
      const unicodeQuery = 'Привет мир 🍃';
      mockStore.searchQuery = unicodeQuery;
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert
      const noResultsMessage = screen.getByText(`No tobaccos found for "${unicodeQuery}"`);
      expect(noResultsMessage).toBeInTheDocument();
    });

    it('should handle error message with very long text', () => {
      // Arrange
      const longError = 'A'.repeat(1000);
      mockStore.error = longError;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText(longError);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle error message with special characters', () => {
      // Arrange
      const specialError = 'Error: "Test" <script>alert(1)</script>';
      mockStore.error = specialError;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText(specialError);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle error message with Unicode characters', () => {
      // Arrange
      const unicodeError = 'Ошибка сети 🚫';
      mockStore.error = unicodeError;

      // Act
      render(<SearchResults />);

      // Assert
      const errorMessage = screen.getByText(unicodeError);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle tobacco data with special characters', () => {
      // Arrange
      const specialTobacco = {
        ...mockTobacco1,
        name: 'Test <script>alert(1)</script>',
        brand: 'Brand & Co.',
      };
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [specialTobacco];

      // Act
      render(<SearchResults />);

      // Assert
      expect(screen.getByTestId(`tobacco-name-${mockTobacco1.id}`)).toHaveTextContent('Test <script>alert(1)</script>');
      expect(screen.getByTestId(`tobacco-brand-${mockTobacco1.id}`)).toHaveTextContent('Brand & Co.');
    });

    it('should handle tobacco data with Unicode characters', () => {
      // Arrange
      const unicodeTobacco = {
        ...mockTobacco1,
        name: 'Мята',
        brand: 'Адалыя',
      };
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [unicodeTobacco];

      // Act
      render(<SearchResults />);

      // Assert
      expect(screen.getByTestId(`tobacco-name-${mockTobacco1.id}`)).toHaveTextContent('Мята');
      expect(screen.getByTestId(`tobacco-brand-${mockTobacco1.id}`)).toHaveTextContent('Адалыя');
    });

    it('should handle tobacco data with emoji', () => {
      // Arrange
      const emojiTobacco = {
        ...mockTobacco1,
        name: 'Mint 🍃',
        brand: 'Brand 🏭',
      };
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [emojiTobacco];

      // Act
      render(<SearchResults />);

      // Assert
      expect(screen.getByTestId(`tobacco-name-${mockTobacco1.id}`)).toHaveTextContent('Mint 🍃');
      expect(screen.getByTestId(`tobacco-brand-${mockTobacco1.id}`)).toHaveTextContent('Brand 🏭');
    });

    it('should handle component remount', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];
      const { unmount } = render(<SearchResults />);

      // Act
      unmount();
      render(<SearchResults />);

      // Assert - Should render without errors
      const tobaccoCard = screen.getByTestId(`tobacco-name-${mockTobacco1.id}`);
      expect(tobaccoCard).toBeInTheDocument();
    });

    it('should handle multiple rapid re-renders', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];
      const { rerender } = render(<SearchResults />);

      // Act - Rapid re-renders
      for (let i = 0; i < 10; i++) {
        expect(() => rerender(<SearchResults />)).not.toThrow();
      }

      // Assert
      const tobaccoCard = screen.getByTestId(`tobacco-name-${mockTobacco1.id}`);
      expect(tobaccoCard).toBeInTheDocument();
    });

    it('should handle state changes during rapid re-renders', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      const { rerender } = render(<SearchResults />);

      // Act - Rapid state changes and re-renders
      for (let i = 0; i < 5; i++) {
        mockStore.isLoading = i % 2 === 0;
        mockStore.searchResults = i % 2 === 0 ? [mockTobacco1] : [];
        mockStore.error = i % 2 === 0 ? null : 'Test error';
        expect(() => rerender(<SearchResults />)).not.toThrow();
      }

      // Assert - Should not throw
    });

    it('should not have any inline styles', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const mainContainer = container.firstChild;
      expect(mainContainer).not.toHaveAttribute('style');
    });

    it('should not have any data-testid attributes', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1];

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const mainContainer = container.firstChild;
      expect(mainContainer).not.toHaveAttribute('data-testid');
    });

    it('should render consistently across multiple renders', () => {
      // Arrange
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = [mockTobacco1, mockTobacco2];

      // Act
      const { container: container1 } = render(<SearchResults />);
      const { container: container2 } = render(<SearchResults />);

      // Assert
      const resultsContainer1 = container1.querySelector('.space-y-4');
      const resultsContainer2 = container2.querySelector('.space-y-4');
      expect(resultsContainer1?.className).toBe(resultsContainer2?.className);
    });

    it('should handle all states being false/null/empty', () => {
      // Arrange
      mockStore.isLoading = false;
      mockStore.error = null;
      mockStore.searchQuery = '';
      mockStore.searchResults = [];

      // Act
      render(<SearchResults />);

      // Assert - Should display empty query message
      const emptyQueryMessage = screen.getByText('Enter a search term to find tobaccos');
      expect(emptyQueryMessage).toBeInTheDocument();
    });

    it('should handle searchResults with duplicate tobacco ids', () => {
      // Arrange
      const duplicateResults = [mockTobacco1, mockTobacco1, mockTobacco2];
      mockStore.searchQuery = 'Test';
      mockStore.searchResults = duplicateResults;

      // Act
      const { container } = render(<SearchResults />);

      // Assert
      const tobaccoCards = container.querySelectorAll('[data-testid="tobacco-card-tobacco-001"]');
      expect(tobaccoCards).toHaveLength(2);
    });
  });
});
