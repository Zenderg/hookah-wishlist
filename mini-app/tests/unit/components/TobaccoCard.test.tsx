/**
 * TobaccoCard Component Unit Tests
 * 
 * Comprehensive test suite for TobaccoCard component following javascript-testing-patterns skill.
 * Tests cover rendering, user interactions, state management, accessibility, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TobaccoCard from '../../../src/components/TobaccoCard';
import { mockStore, createMockStoreWithWishlist, createMockStoreLoading, resetMockStore, clearMockStore } from '../../mocks/mockStore';
import { mockTobacco1, mockTobacco2, createMockTobacco, createMockWishlist, createMockWishlistItem } from '../../fixtures/mockData';

// Mock useStore hook
vi.mock('../../../src/store/useStore', () => ({
  useStore: vi.fn(() => mockStore),
}));

describe('TobaccoCard Component', () => {
  beforeEach(() => {
    resetMockStore();
    clearMockStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Rendering Tests
   */
  describe('Rendering', () => {
    it('should render TobaccoCard component successfully', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.bg-white');
      expect(card).toBeInTheDocument();
    });

    it('should display tobacco brand and name correctly', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('Adalya - Mint')).toBeInTheDocument();
    });

    it('should display tobacco flavor when present', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('🍃 Mint')).toBeInTheDocument();
    });

    it('should display tobacco strength when present', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('💪 Strength: light')).toBeInTheDocument();
    });

    it('should display tobacco description when present', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('Refreshing mint flavor with cool sensation')).toBeInTheDocument();
    });

    it('should have correct CSS classes for card container', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.bg-white');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-4', 'hover:shadow-lg', 'transition-shadow');
    });

    it('should have correct card structure with flex container', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const flexContainer = container.querySelector('div.flex.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render with tobacco ID', () => {
      const tobacco = createMockTobacco({ id: 'custom-id-123' });
      render(<TobaccoCard tobacco={tobacco} />);
      
      expect(screen.getByText('Mock Brand - Mock Tobacco')).toBeInTheDocument();
    });
  });

  /**
   * Wishlist Status Tests
   */
  describe('Wishlist Status', () => {
    it('should display "Add to Wishlist" button when tobacco is not in wishlist', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const addButton = screen.getByRole('button', { name: '+ Add' });
      expect(addButton).toBeInTheDocument();
    });

    it('should display "Remove from Wishlist" button when tobacco is in wishlist', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const removeButton = screen.getByRole('button', { name: '− Remove' });
      expect(removeButton).toBeInTheDocument();
    });

    it('should show green button for adding to wishlist', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      expect(button).toHaveClass('bg-green-500', 'text-white', 'hover:bg-green-600');
    });

    it('should show red button for removing from wishlist', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '− Remove' });
      expect(button).toHaveClass('bg-red-500', 'text-white', 'hover:bg-red-600');
    });

    it('should correctly identify tobacco in wishlist by ID', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco2.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      render(<TobaccoCard tobacco={mockTobacco2} />);
      
      expect(screen.getByRole('button', { name: '− Remove' })).toBeInTheDocument();
    });

    it('should correctly identify tobacco not in wishlist by ID', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco2.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });
  });

  /**
   * User Interaction Tests - Add to Wishlist
   */
  describe('User Interaction - Add to Wishlist', () => {
    it('should call addToWishlist when clicking add button', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const addButton = screen.getByRole('button', { name: '+ Add' });
      await user.click(addButton);
      
      expect(mockStore.addToWishlist).toHaveBeenCalledTimes(1);
      expect(mockStore.addToWishlist).toHaveBeenCalledWith(mockTobacco1.id);
    });

    it('should call addToWishlist with correct tobacco ID', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco2} />);
      
      const addButton = screen.getByRole('button', { name: '+ Add' });
      await user.click(addButton);
      
      expect(mockStore.addToWishlist).toHaveBeenCalledWith(mockTobacco2.id);
    });

    it('should disable button during loading state', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      expect(button).toBeDisabled();
    });

    it('should show disabled styling when loading', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      expect(button).toHaveClass('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
    });

    it('should not call addToWishlist when button is disabled', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      await user.click(button);
      
      expect(mockStore.addToWishlist).not.toHaveBeenCalled();
    });
  });

  /**
   * User Interaction Tests - Remove from Wishlist
   */
  describe('User Interaction - Remove from Wishlist', () => {
    it('should call removeFromWishlist when clicking remove button', async () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const removeButton = screen.getByRole('button', { name: '− Remove' });
      await user.click(removeButton);
      
      expect(mockStore.removeFromWishlist).toHaveBeenCalledTimes(1);
      expect(mockStore.removeFromWishlist).toHaveBeenCalledWith(mockTobacco1.id);
    });

    it('should call removeFromWishlist with correct tobacco ID', async () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco2.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco2} />);
      
      const removeButton = screen.getByRole('button', { name: '− Remove' });
      await user.click(removeButton);
      
      expect(mockStore.removeFromWishlist).toHaveBeenCalledWith(mockTobacco2.id);
    });

    it('should disable button during loading state', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '− Remove' });
      expect(button).toBeDisabled();
    });

    it('should show disabled styling when loading', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '− Remove' });
      expect(button).toHaveClass('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
    });

    it('should not call removeFromWishlist when button is disabled', async () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      mockStore.isLoading = true;
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '− Remove' });
      await user.click(button);
      
      expect(mockStore.removeFromWishlist).not.toHaveBeenCalled();
    });
  });

  /**
   * Loading State Tests
   */
  describe('Loading State', () => {
    it('should disable button when isLoading is true', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should enable button when isLoading is false', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = false;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should apply disabled styling when isLoading is true', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
    });

    it('should have disabled classes in className (Tailwind conditional classes)', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = false;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button');
      // Tailwind conditional classes are always present in className
      expect(button).toHaveClass('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
      // But button should not be disabled
      expect(button).not.toBeDisabled();
    });

    it('should prevent button clicks when isLoading is true', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockStore.addToWishlist).not.toHaveBeenCalled();
    });
  });

  /**
   * Conditional Rendering Tests
   */
  describe('Conditional Rendering', () => {
    it('should display flavor when tobacco has flavor', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('🍃 Mint')).toBeInTheDocument();
    });

    it('should not display flavor when tobacco has no flavor', () => {
      const tobaccoWithoutFlavor = createMockTobacco({ flavor: undefined });
      render(<TobaccoCard tobacco={tobaccoWithoutFlavor} />);
      
      expect(screen.queryByText(/🍃/)).not.toBeInTheDocument();
    });

    it('should display strength when tobacco has strength', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('💪 Strength: light')).toBeInTheDocument();
    });

    it('should not display strength when tobacco has no strength', () => {
      const tobaccoWithoutStrength = createMockTobacco({ strength: undefined });
      render(<TobaccoCard tobacco={tobaccoWithoutStrength} />);
      
      expect(screen.queryByText(/💪/)).not.toBeInTheDocument();
    });

    it('should display description when tobacco has description', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('Refreshing mint flavor with cool sensation')).toBeInTheDocument();
    });

    it('should not display description when tobacco has no description', () => {
      const tobaccoWithoutDescription = createMockTobacco({ description: undefined });
      render(<TobaccoCard tobacco={tobaccoWithoutDescription} />);
      
      const description = screen.queryByText('Mock description');
      expect(description).not.toBeInTheDocument();
    });

    it('should handle tobacco with all optional fields present', () => {
      const tobacco = createMockTobacco({
        flavor: 'Test Flavor',
        strength: 'strong',
        description: 'Test description',
      });
      render(<TobaccoCard tobacco={tobacco} />);
      
      expect(screen.getByText('🍃 Test Flavor')).toBeInTheDocument();
      expect(screen.getByText('💪 Strength: strong')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should handle tobacco with all optional fields absent', () => {
      const tobacco = createMockTobacco({
        flavor: undefined,
        strength: undefined,
        description: undefined,
      });
      render(<TobaccoCard tobacco={tobacco} />);
      
      expect(screen.queryByText(/🍃/)).not.toBeInTheDocument();
      expect(screen.queryByText(/💪/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mock description/)).not.toBeInTheDocument();
    });

    it('should handle null wishlist gracefully', () => {
      mockStore.wishlist = null;
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });

    it('should handle undefined wishlist gracefully', () => {
      mockStore.wishlist = undefined as any;
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });
  });

  /**
   * Accessibility Tests
   */
  describe('Accessibility', () => {
    it('should have accessible button name for add action', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible button name for remove action', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '− Remove' });
      expect(button).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      // Check for heading
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-800');
    });

    it('should be accessible via keyboard navigation', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      
      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockStore.addToWishlist).toHaveBeenCalled();
    });

    it('should be accessible via Space key', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      
      // Focus button
      button.focus();
      expect(button).toHaveFocus();
      
      // Press Space
      await user.keyboard(' ');
      expect(mockStore.addToWishlist).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes when disabled', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have descriptive text content for screen readers', () => {
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByText('Adalya - Mint')).toBeInTheDocument();
      expect(screen.getByText('🍃 Mint')).toBeInTheDocument();
      expect(screen.getByText('💪 Strength: light')).toBeInTheDocument();
      expect(screen.getByText('Refreshing mint flavor with cool sensation')).toBeInTheDocument();
    });
  });

  /**
   * Styling Tests
   */
  describe('Styling', () => {
    it('should have correct background color', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.bg-white');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.rounded-lg');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg');
    });

    it('should have shadow', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.shadow-md');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('shadow-md');
    });

    it('should have hover shadow effect', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.hover\\:shadow-lg');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('should have padding', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.p-4');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-4');
    });

    it('should have transition shadow effect', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const card = container.querySelector('div.transition-shadow');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('transition-shadow');
    });

    it('should have correct button styling for add action', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = container.querySelector('button.bg-green-500');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-green-500', 'text-white', 'hover:bg-green-600');
    });

    it('should have correct button styling for remove action', () => {
      const wishlistItem = createMockWishlistItem({ tobaccoId: mockTobacco1.id });
      mockStore.wishlist = createMockWishlist({ items: [wishlistItem] });
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = container.querySelector('button.bg-red-500');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-red-500', 'text-white', 'hover:bg-red-600');
    });

    it('should have correct heading styling', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const heading = container.querySelector('h3');
      expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-800');
    });

    it('should have correct text color for flavor', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const flavorText = container.querySelector('p.text-gray-600');
      expect(flavorText).toBeInTheDocument();
      expect(flavorText).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should have correct text color for description', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const descriptionText = container.querySelector('p.text-gray-500');
      expect(descriptionText).toBeInTheDocument();
      expect(descriptionText).toHaveClass('text-sm', 'text-gray-500');
    });

    it('should have line clamp for description', () => {
      const { container } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const descriptionText = container.querySelector('p.line-clamp-2');
      expect(descriptionText).toBeInTheDocument();
      expect(descriptionText).toHaveClass('line-clamp-2');
    });
  });

  /**
   * Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle incomplete tobacco data', () => {
      const incompleteTobacco = {
        id: 'incomplete-1',
        name: 'Incomplete',
        brand: 'Test Brand',
      } as any;
      
      render(<TobaccoCard tobacco={incompleteTobacco} />);
      
      expect(screen.getByText('Test Brand - Incomplete')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });

    it('should handle special characters in tobacco data', () => {
      const tobaccoWithSpecialChars = createMockTobacco({
        name: 'Test <script>alert("xss")</script>',
        brand: 'Brand & Co.',
        flavor: 'Flavor "special" & unique',
        description: 'Description with < > & " \' special chars',
      });
      
      render(<TobaccoCard tobacco={tobaccoWithSpecialChars} />);
      
      expect(screen.getByText('Brand & Co. - Test <script>alert("xss")</script>')).toBeInTheDocument();
      expect(screen.getByText('🍃 Flavor "special" & unique')).toBeInTheDocument();
    });

    it('should handle Unicode characters in tobacco data', () => {
      const tobaccoWithUnicode = createMockTobacco({
        name: 'Тестовое название',
        brand: 'Бренд',
        flavor: 'Аромат',
        description: 'Описание на русском языке',
      });
      
      render(<TobaccoCard tobacco={tobaccoWithUnicode} />);
      
      expect(screen.getByText('Бренд - Тестовое название')).toBeInTheDocument();
      expect(screen.getByText('🍃 Аромат')).toBeInTheDocument();
      expect(screen.getByText('Описание на русском языке')).toBeInTheDocument();
    });

    it('should handle emoji in tobacco data', () => {
      const tobaccoWithEmoji = createMockTobacco({
        name: '🍓 Strawberry 🍓',
        brand: '🌟 Star Brand 🌟',
        flavor: '🍋 Lemon 🍋',
        description: '🎉 Great flavor! 🎉',
      });
      
      render(<TobaccoCard tobacco={tobaccoWithEmoji} />);
      
      expect(screen.getByText('🌟 Star Brand 🌟 - 🍓 Strawberry 🍓')).toBeInTheDocument();
      expect(screen.getByText('🍃 🍋 Lemon 🍋')).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const tobaccoWithLongDescription = createMockTobacco({
        description: longDescription,
      });
      
      render(<TobaccoCard tobacco={tobaccoWithLongDescription} />);
      
      const description = screen.getByText((content) => content.startsWith('A'));
      expect(description).toBeInTheDocument();
    });

    it('should handle empty string fields', () => {
      const tobaccoWithEmptyFields = createMockTobacco({
        flavor: '',
        strength: undefined,
        description: '',
      });
      
      render(<TobaccoCard tobacco={tobaccoWithEmptyFields} />);
      
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
      expect(screen.queryByText(/🍃/)).not.toBeInTheDocument();
      expect(screen.queryByText(/💪/)).not.toBeInTheDocument();
    });

    it('should handle whitespace-only fields', () => {
      const tobaccoWithWhitespace = createMockTobacco({
        flavor: '   ',
        strength: undefined,
        description: '   ',
      });
      
      render(<TobaccoCard tobacco={tobaccoWithWhitespace} />);
      
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });

    it('should handle rapid button clicks', async () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      const user = userEvent.setup();
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      const button = screen.getByRole('button', { name: '+ Add' });
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(mockStore.addToWishlist).toHaveBeenCalledTimes(3);
    });

    it('should handle component unmount during loading', () => {
      mockStore.wishlist = createMockWishlist({ items: [] });
      mockStore.isLoading = true;
      
      const { unmount } = render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle undefined values in tobacco data', () => {
      const tobaccoWithUndefined = {
        id: 'test-id',
        name: 'Test Name',
        brand: 'Test Brand',
        flavor: undefined,
        strength: undefined,
        description: undefined,
      } as any;
      
      render(<TobaccoCard tobacco={tobaccoWithUndefined} />);
      
      expect(screen.getByText('Test Brand - Test Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });

    it('should handle null values in tobacco data', () => {
      const tobaccoWithNull = {
        id: 'test-id',
        name: 'Test Name',
        brand: 'Test Brand',
        flavor: null,
        strength: null,
        description: null,
      } as any;
      
      render(<TobaccoCard tobacco={tobaccoWithNull} />);
      
      expect(screen.getByText('Test Brand - Test Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });

    it('should handle tobacco with numeric ID', () => {
      const tobaccoWithNumericId = {
        id: 12345,
        name: 'Test',
        brand: 'Brand',
      } as any;
      
      render(<TobaccoCard tobacco={tobaccoWithNumericId} />);
      
      expect(screen.getByText('Brand - Test')).toBeInTheDocument();
    });

    it('should handle tobacco with very long name', () => {
      const longName = 'A'.repeat(200);
      const tobaccoWithLongName = createMockTobacco({
        name: longName,
      });
      
      const { container } = render(<TobaccoCard tobacco={tobaccoWithLongName} />);
      
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toContain('A');
    });

    it('should handle tobacco with very long brand', () => {
      const longBrand = 'B'.repeat(200);
      const tobaccoWithLongBrand = createMockTobacco({
        brand: longBrand,
      });
      
      const { container } = render(<TobaccoCard tobacco={tobaccoWithLongBrand} />);
      
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toContain('B');
    });

    it('should handle wishlist with many items', () => {
      const manyItems = Array.from({ length: 100 }, (_, i) =>
        createMockWishlistItem({ tobaccoId: `tobacco-${i}` })
      );
      mockStore.wishlist = createMockWishlist({ items: manyItems });
      
      render(<TobaccoCard tobacco={mockTobacco1} />);
      
      expect(screen.getByRole('button', { name: '+ Add' })).toBeInTheDocument();
    });

    it('should handle wishlist with duplicate tobacco IDs', () => {
      const duplicateItems = [
        createMockWishlistItem({ tobaccoId: 'duplicate-id' }),
        createMockWishlistItem({ tobaccoId: 'duplicate-id' }),
      ];
      mockStore.wishlist = createMockWishlist({ items: duplicateItems });
      
      const tobaccoWithDuplicateId = createMockTobacco({ id: 'duplicate-id' });
      render(<TobaccoCard tobacco={tobaccoWithDuplicateId} />);
      
      expect(screen.getByRole('button', { name: '− Remove' })).toBeInTheDocument();
    });
  });
});
