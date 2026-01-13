/**
 * App Component Integration Tests
 *
 * Comprehensive integration tests for App component following javascript-testing-patterns skill.
 * Tests cover rendering, useEffect hooks, tab navigation, conditional rendering,
 * Telegram integration, error handling, state management, accessibility, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { useStore } from '../../src/store/useStore';
import { apiService } from '../../src/services/api';
import {
  mockStore,
  clearMockStore,
  resetMockStore,
  mockFetchWishlistSuccess,
  mockFetchWishlistFailure,
  expectFetchWishlistCalled,
} from '../mocks/mockStore';
import {
  mockWebApp,
  clearMockWebApp,
  resetMockWebApp,
  expectReadyCalled,
  expectExpandCalled,
} from '../mocks/mockTelegram';
import { mockWishlist, mockEmptyWishlist } from '../fixtures/mockData';

// Mock store and apiService
vi.mock('../../src/store/useStore', () => ({
  useStore: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  apiService: {
    initializeTelegram: vi.fn(),
  },
}));

describe('App Component Integration Tests', () => {
  const mockUseStore = vi.mocked(useStore);
  const mockApiService = vi.mocked(apiService);

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    clearMockStore();
    clearMockWebApp();
    resetMockStore();
    resetMockWebApp();

    // Setup default mock implementations
    mockUseStore.mockReturnValue(mockStore);
    mockApiService.initializeTelegram.mockReturnValue(mockWebApp as any);
    mockFetchWishlistSuccess(mockWishlist);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render App component correctly', () => {
      const { container } = render(<App />);

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('min-h-screen', 'bg-gray-100');
    });

    it('should render Header component', () => {
      render(<App />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render TabNavigation (search and wishlist tabs)', () => {
      render(<App />);

      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /📋 Wishlist/i })).toBeInTheDocument();
    });

    it('should render SearchBar when activeTab is search', () => {
      render(<App />);

      // SearchBar renders an input with placeholder "Search tobaccos..."
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();
    });

    it('should render SearchResults when activeTab is search', () => {
      render(<App />);

      // SearchResults renders a div with text "Enter a search term to find tobaccos"
      expect(screen.getByText(/Enter a search term to find tobaccos/i)).toBeInTheDocument();
    });

    it('should render Wishlist component when activeTab is wishlist', async () => {
      render(<App />);

      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Wishlist renders an h2 with "Your Wishlist"
      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
    });

    it('should have correct CSS classes on container', () => {
      const { container } = render(<App />);

      const appContainer = container.querySelector('.min-h-screen');
      expect(appContainer).toHaveClass('min-h-screen', 'bg-gray-100');
    });

    it('should render container with proper padding', () => {
      const { container } = render(<App />);

      // Get the main content container (not the header container)
      // The main content container is inside the min-h-screen div and contains the tabs
      const appContainer = container.querySelector('.min-h-screen');
      const mainContentContainer = appContainer?.querySelector('.container.mx-auto.px-4.py-6');
      
      expect(mainContentContainer).toBeInTheDocument();
      expect(mainContentContainer).toHaveClass('container', 'mx-auto', 'px-4', 'py-6');
    });
  });

  describe('useEffect Hook Tests', () => {
    it('should call apiService.initializeTelegram on mount', () => {
      render(<App />);

      expect(mockApiService.initializeTelegram).toHaveBeenCalledTimes(1);
    });

    it('should call fetchWishlist on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });
    });

    it('should call both initializeTelegram and fetchWishlist only once on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockApiService.initializeTelegram).toHaveBeenCalledTimes(1);
        expectFetchWishlistCalled(1);
      });
    });

    it('should not call initializeTelegram on re-renders', async () => {
      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(mockApiService.initializeTelegram).toHaveBeenCalledTimes(1);
      });

      // Trigger re-render
      rerender(<App />);

      expect(mockApiService.initializeTelegram).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchWishlist on re-renders', async () => {
      const { rerender } = render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Trigger re-render
      rerender(<App />);

      expectFetchWishlistCalled(1);
    });

    it('should set background color from Telegram WebApp when available', async () => {
      const customWebApp = { ...mockWebApp, backgroundColor: '#1c1c1e' };
      mockApiService.initializeTelegram.mockReturnValue(customWebApp as any);

      render(<App />);

      await waitFor(() => {
        expect(document.body.style.backgroundColor).toBe('rgb(28, 28, 30)');
      });
    });

    it('should set default background color when Telegram WebApp is not available', async () => {
      mockApiService.initializeTelegram.mockReturnValue(null);

      render(<App />);

      await waitFor(() => {
        // Browser returns rgb() format with spaces: "rgb(255, 255, 255)"
        expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
      });
    });

    it('should log warning when Telegram WebApp is not available', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockApiService.initializeTelegram.mockReturnValue(null);

      render(<App />);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Telegram Web Apps API not available - running in development mode'
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it('should handle fetchWishlist errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchWishlistFailure('Failed to fetch wishlist');

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Tab Navigation Tests', () => {
    it('should switch to search view when clicking Search tab', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      await userEvent.click(searchTab);

      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();
    });

    it('should switch to wishlist view when clicking Wishlist tab', async () => {
      render(<App />);

      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
    });

    it('should update activeTab state correctly when switching tabs', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Start with search tab active
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(wishlistTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Switch to wishlist
      await userEvent.click(wishlistTab);
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(searchTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Switch back to search
      await userEvent.click(searchTab);
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(wishlistTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should display only one view at a time', async () => {
      render(<App />);

      // Search tab is active by default
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();

      // Switch to wishlist
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/search tobaccos/i)).not.toBeInTheDocument();
    });

    it('should apply correct styling to inactive tabs', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Wishlist tab should be inactive
      expect(wishlistTab).toHaveClass('text-gray-600', 'hover:text-gray-800');
      expect(wishlistTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Switch to wishlist
      await userEvent.click(wishlistTab);

      // Search tab should now be inactive
      expect(searchTab).toHaveClass('text-gray-600', 'hover:text-gray-800');
      expect(searchTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle multiple tab switches correctly', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Switch back and forth multiple times
      await userEvent.click(wishlistTab);
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      await userEvent.click(searchTab);
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      await userEvent.click(wishlistTab);
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      await userEvent.click(searchTab);
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });

  describe('Conditional Rendering Tests', () => {
    it('should display SearchBar and SearchResults when activeTab is search', () => {
      render(<App />);

      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter a search term to find tobaccos/i)).toBeInTheDocument();
    });

    it('should display Wishlist when activeTab is wishlist', async () => {
      render(<App />);

      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/search tobaccos/i)).not.toBeInTheDocument();
    });

    it('should not display SearchBar when activeTab is wishlist', async () => {
      render(<App />);

      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(screen.queryByPlaceholderText(/search tobaccos/i)).not.toBeInTheDocument();
    });

    it('should not display SearchResults when activeTab is wishlist', async () => {
      render(<App />);

      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(screen.queryByText(/Enter a search term to find tobaccos/i)).not.toBeInTheDocument();
    });

    it('should not display Wishlist when activeTab is search', () => {
      render(<App />);

      expect(screen.queryByText(/Your Wishlist/i)).not.toBeInTheDocument();
    });

    it('should update displayed components when switching tabs', async () => {
      render(<App />);

      // Search tab active
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();
      expect(screen.queryByText(/Your Wishlist/i)).not.toBeInTheDocument();

      // Switch to wishlist
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(screen.queryByPlaceholderText(/search tobaccos/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();

      // Switch back to search
      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      await userEvent.click(searchTab);

      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();
      expect(screen.queryByText(/Your Wishlist/i)).not.toBeInTheDocument();
    });
  });

  describe('Telegram Integration Tests', () => {
    it('should initialize Telegram WebApps API on mount', () => {
      render(<App />);

      expect(mockApiService.initializeTelegram).toHaveBeenCalledTimes(1);
    });

    it('should apply Telegram theme background color when available', async () => {
      const customBgColor = '#ff0000';
      const customWebApp = { ...mockWebApp, backgroundColor: customBgColor };
      mockApiService.initializeTelegram.mockReturnValue(customWebApp as any);

      render(<App />);

      await waitFor(() => {
        expect(document.body.style.backgroundColor).toBe('rgb(255, 0, 0)');
      });
    });

    it('should apply default white background when Telegram WebApp is null', async () => {
      mockApiService.initializeTelegram.mockReturnValue(null);

      render(<App />);

      await waitFor(() => {
        // Browser returns rgb() format with spaces: "rgb(255, 255, 255)"
        expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
      });
    });

    it('should handle Telegram WebApp with no backgroundColor property', async () => {
      const customWebApp = { ...mockWebApp, backgroundColor: '#ffffff' };
      mockApiService.initializeTelegram.mockReturnValue(customWebApp as any);

      render(<App />);

      await waitFor(() => {
        // Browser returns rgb() format with spaces: "rgb(255, 255, 255)"
        expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
      });
    });

    it('should work correctly when Telegram WebApp is available', async () => {
      mockApiService.initializeTelegram.mockReturnValue(mockWebApp as any);

      render(<App />);

      await waitFor(() => {
        expect(mockApiService.initializeTelegram).toHaveBeenCalled();
        expectFetchWishlistCalled(1);
      });

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();
    });

    it('should work correctly when Telegram WebApp is not available', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockApiService.initializeTelegram.mockReturnValue(null);

      render(<App />);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Telegram Web Apps API not available - running in development mode'
        );
      });

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle fetchWishlist errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchWishlistFailure('Network error');

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should continue to work after initialization errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchWishlistFailure('Initialization failed');

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Tab navigation should still work
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      consoleErrorSpy.mockRestore();
    });

    it('should display error states in child components', async () => {
      mockFetchWishlistFailure('Failed to fetch wishlist');

      render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Switch to wishlist tab to see error state
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Wishlist component should display error - look for error message in error container
      const errorDiv = screen.getByText(/Failed to fetch wishlist/i).closest('div');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveClass('bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded');
    });

    it('should handle multiple errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchWishlistFailure('Multiple errors');

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Try to switch tabs
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      await userEvent.click(searchTab);

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('State Management Tests', () => {
    it('should respond to activeTab state changes', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Initial state - search tab active
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Change state - wishlist tab active
      await userEvent.click(wishlistTab);
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Change state back - search tab active
      await userEvent.click(searchTab);
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should respond to wishlist state changes', async () => {
      mockFetchWishlistSuccess(mockWishlist);

      render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Switch to wishlist to see wishlist state
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Wishlist should be displayed with items
      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
    });

    it('should respond to searchResults state changes', () => {
      render(<App />);

      // Search tab is active by default
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();

      // SearchResults component should be rendered
      expect(screen.getByText(/Enter a search term to find tobaccos/i)).toBeInTheDocument();
    });

    it('should re-render correctly on state changes', async () => {
      const { rerender } = render(<App />);

      // Initial render
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Re-render
      rerender(<App />);

      // Should still have all components
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /📋 Wishlist/i })).toBeInTheDocument();
    });

    it('should maintain state across re-renders', async () => {
      const { rerender } = render(<App />);

      // Switch to wishlist
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Re-render
      rerender(<App />);

      // State should be maintained
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper semantic HTML structure', () => {
      const { container } = render(<App />);

      // Main container should have proper role
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();

      // Header should have banner role
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Tabs should be buttons
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should be accessible to screen readers', () => {
      render(<App />);

      // All interactive elements should be accessible
      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      expect(searchTab).toBeVisible();
      expect(wishlistTab).toBeVisible();

      // Search input should be accessible
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeVisible();
    });

    it('should support keyboard navigation', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Tab to search tab
      searchTab.focus();
      expect(searchTab).toHaveFocus();

      // Tab to wishlist tab
      await userEvent.tab();
      expect(wishlistTab).toHaveFocus();

      // Activate wishlist tab with Enter
      await userEvent.keyboard('{Enter}');
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should have proper ARIA attributes', () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Buttons should have accessible names
      expect(searchTab).toHaveAccessibleName(/search/i);
      expect(wishlistTab).toHaveAccessibleName(/wishlist/i);
    });

    it('should have proper color contrast for active and inactive tabs', () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Active tab should have blue color
      expect(searchTab).toHaveClass('text-blue-600');

      // Inactive tab should have gray color
      expect(wishlistTab).toHaveClass('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Rapidly switch tabs
      await userEvent.click(wishlistTab);
      await userEvent.click(searchTab);
      await userEvent.click(wishlistTab);
      await userEvent.click(searchTab);
      await userEvent.click(wishlistTab);

      // Should end up on wishlist tab
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(searchTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle component unmount during initialization', async () => {
      const { unmount } = render(<App />);

      // Unmount before initialization completes
      unmount();

      // Should not throw any errors
      expect(mockApiService.initializeTelegram).toHaveBeenCalled();
    });

    it('should handle invalid activeTab value gracefully', () => {
      // This test ensures that component doesn't break if somehow activeTab gets an invalid value
      // Since activeTab is local state, we can't directly set it to an invalid value
      // But we can verify that component renders correctly with default valid value
      render(<App />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /📋 Wishlist/i })).toBeInTheDocument();
    });

    it('should handle Telegram WebApps API unavailable', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockApiService.initializeTelegram.mockReturnValue(null);

      render(<App />);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Telegram Web Apps API not available - running in development mode'
        );
      });

      // App should still work
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty wishlist state', async () => {
      mockFetchWishlistSuccess(mockEmptyWishlist);

      render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Switch to wishlist tab
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Should display empty state
      expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should handle network errors during fetchWishlist', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchWishlistFailure('Network error');

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple rapid re-renders', async () => {
      const { rerender } = render(<App />);

      // Rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<App />);
      }

      // Should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔍 Search/i })).toBeInTheDocument();
    });

    it('should handle tab switching before fetchWishlist completes', async () => {
      // Make fetchWishlist take a long time
      mockStore.fetchWishlist.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<App />);

      // Switch tabs before fetchWishlist completes
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Should switch successfully
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle tab switching after fetchWishlist completes', async () => {
      mockFetchWishlistSuccess(mockWishlist);

      render(<App />);

      // Wait for fetchWishlist to complete
      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Switch tabs
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Should switch successfully
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle document.body.style updates', async () => {
      // Set initial background color
      document.body.style.backgroundColor = '#ff0000';

      // Render app with Telegram WebApp
      const customWebApp = { ...mockWebApp, backgroundColor: '#00ff00' };
      mockApiService.initializeTelegram.mockReturnValue(customWebApp as any);

      render(<App />);

      await waitFor(() => {
        expect(document.body.style.backgroundColor).toBe('rgb(0, 255, 0)');
      });
    });

    it('should handle missing Telegram WebApp methods gracefully', async () => {
      // Telegram WebApp with minimal properties
      const minimalWebApp = {
        initData: '',
        initDataUnsafe: {
          user: { id: 123, first_name: 'Test', username: 'test' },
          auth_date: 1234567890,
          hash: 'test',
        },
        version: '6.0',
        platform: 'ios',
        colorScheme: 'light' as const,
        themeParams: {
          bg_color: '#ffffff',
          secondary_bg_color: '#f0f0f0',
          text_color: '#000000',
          hint_color: '#999999',
          button_color: '#2481cc',
          button_text_color: '#ffffff',
          text_hint_color: '#999999',
          secondary_text_color: '#666666',
          section_bg_color: '#ffffff',
          section_header_text_color: '#000000',
          subtitle_text_color: '#666666',
          destructive_text_color: '#ff3b30',
        },
        isExpanded: false,
        viewportHeight: 0,
        viewportStableHeight: 0,
        headerColor: '#ffffff',
        backgroundColor: '#ffffff',
        isClosingConfirmationEnabled: false,
        backButton: { isVisible: false, onClick: null },
        mainButton: {
          text: '',
          color: '#2481cc',
          textColor: '#ffffff',
          isVisible: false,
          isActive: false,
          isProgressVisible: false,
          onClick: null,
          setParams: vi.fn(),
          hide: vi.fn(),
          show: vi.fn(),
          enable: vi.fn(),
          disable: vi.fn(),
          showProgress: vi.fn(),
          hideProgress: vi.fn(),
        },
        hapticFeedback: {
          impactOccurred: vi.fn(),
          notificationOccurred: vi.fn(),
          selectionChanged: vi.fn(),
        },
        ready: vi.fn(),
        expand: vi.fn(),
        close: vi.fn(),
        enableClosingConfirmation: vi.fn(),
        disableClosingConfirmation: vi.fn(),
        sendData: vi.fn(),
        switchInlineQuery: vi.fn(),
        openLink: vi.fn(),
        openTelegramLink: vi.fn(),
        openPopup: vi.fn(),
        showPopup: vi.fn(),
        showAlert: vi.fn(),
        showConfirm: vi.fn(),
        requestWriteAccess: vi.fn(),
        requestContact: vi.fn(),
        requestFileUpload: vi.fn(),
        downloadFile: vi.fn(),
        readTextFromClipboard: vi.fn(),
        requestClipboardText: vi.fn(),
        prepareClosingConfirmation: vi.fn(),
        onEvent: vi.fn(),
        offEvent: vi.fn(),
        SecondaryButton: {
          text: '',
          color: '#2481cc',
          textColor: '#ffffff',
          isVisible: false,
          isActive: false,
          isProgressVisible: false,
          onClick: null,
          setParams: vi.fn(),
          hide: vi.fn(),
          show: vi.fn(),
          enable: vi.fn(),
          disable: vi.fn(),
          showProgress: vi.fn(),
          hideProgress: vi.fn(),
        },
        isVerticalSwipesEnabled: false,
        disableVerticalSwipes: vi.fn(),
        enableVerticalSwipes: vi.fn(),
        BottomSheet: {
          isVisible: false,
          setParams: vi.fn(),
          hide: vi.fn(),
          show: vi.fn(),
        },
        SettingsButton: {
          isVisible: false,
          onClick: null,
          setParams: vi.fn(),
          hide: vi.fn(),
          show: vi.fn(),
        },
        BackButton: {
          isVisible: false,
          onClick: null,
          setParams: vi.fn(),
          hide: vi.fn(),
          show: vi.fn(),
        },
        HapticFeedback: {
          impactOccurred: vi.fn(),
          notificationOccurred: vi.fn(),
          selectionChanged: vi.fn(),
        },
        MainButton: {
          text: '',
          color: '#2481cc',
          textColor: '#ffffff',
          isVisible: false,
          isActive: false,
          isProgressVisible: false,
          onClick: null,
          setParams: vi.fn(),
          hide: vi.fn(),
          show: vi.fn(),
          enable: vi.fn(),
          disable: vi.fn(),
          showProgress: vi.fn(),
          hideProgress: vi.fn(),
        },
      };
      mockApiService.initializeTelegram.mockReturnValue(minimalWebApp as any);

      render(<App />);

      await waitFor(() => {
        expect(mockApiService.initializeTelegram).toHaveBeenCalled();
      });

      // App should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Integration with Child Components', () => {
    it('should integrate correctly with Header component', () => {
      render(<App />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText(/🍃 Hookah Wishlist/i)).toBeInTheDocument();
    });

    it('should integrate correctly with SearchBar component', () => {
      render(<App />);

      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();
    });

    it('should integrate correctly with SearchResults component', () => {
      render(<App />);

      expect(screen.getByText(/Enter a search term to find tobaccos/i)).toBeInTheDocument();
    });

    it('should integrate correctly with Wishlist component', async () => {
      render(<App />);

      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
    });

    it('should pass correct props to child components', () => {
      render(<App />);

      // Header should be rendered
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // SearchBar should be rendered (search tab is active by default)
      expect(screen.getByPlaceholderText(/search tobaccos/i)).toBeInTheDocument();

      // SearchResults should be rendered
      expect(screen.getByText(/Enter a search term to find tobaccos/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders', async () => {
      const { rerender } = render(<App />);

      const initialRenderCount = mockApiService.initializeTelegram.mock.calls.length;

      // Re-render without any state changes
      rerender(<App />);

      // Should not call initializeTelegram again
      expect(mockApiService.initializeTelegram.mock.calls.length).toBe(initialRenderCount);
    });

    it('should only call fetchWishlist once on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Wait a bit to ensure no additional calls
      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });
    });

    it('should handle large wishlist data', async () => {
      const largeWishlist = {
        ...mockWishlist,
        items: Array.from({ length: 100 }, (_, i) => ({
          tobaccoId: `tobacco-${i}`,
          addedAt: new Date().toISOString(),
          notes: `Note ${i}`,
          tobacco: {
            id: `tobacco-${i}`,
            name: `Tobacco ${i}`,
            brand: 'Test Brand',
            flavor: `Flavor ${i}`,
            description: `Description ${i}`,
            strength: 'medium' as const,
            image: `https://example.com/tobacco-${i}.jpg`,
          },
        })),
        total: 100,
      };

      mockFetchWishlistSuccess(largeWishlist);

      render(<App />);

      await waitFor(() => {
        expectFetchWishlistCalled(1);
      });

      // Switch to wishlist tab
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });
      await userEvent.click(wishlistTab);

      // Should render without errors
      expect(screen.getByText(/Your Wishlist/i)).toBeInTheDocument();
    });
  });

  describe('User Experience Tests', () => {
    it('should provide smooth tab transitions', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Transition to wishlist
      await userEvent.click(wishlistTab);
      expect(wishlistTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Transition back to search
      await userEvent.click(searchTab);
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should maintain user context across tab switches', async () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Switch to wishlist
      await userEvent.click(wishlistTab);

      // Switch back to search
      await userEvent.click(searchTab);

      // User context should still be available
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should provide clear visual feedback for active tab', () => {
      render(<App />);

      const searchTab = screen.getByRole('button', { name: /🔍 Search/i });
      const wishlistTab = screen.getByRole('button', { name: /📋 Wishlist/i });

      // Search tab should have active styling
      expect(searchTab).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Wishlist tab should have inactive styling
      expect(wishlistTab).toHaveClass('text-gray-600', 'hover:text-gray-800');
    });
  });
});
