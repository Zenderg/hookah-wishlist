/**
 * TabNavigation Component Unit Tests
 * 
 * Comprehensive unit tests for TabNavigation component following javascript-testing-patterns skill best practices.
 * Tests cover rendering, tab display, active tab state, user interactions, state management, accessibility, styling, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TabNavigation from '../../../src/components/TabNavigation';

describe('TabNavigation Component', () => {
  /**
   * Setup and cleanup for each test
   */
  beforeEach(() => {
    // No setup needed as component uses local state
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
   * Verify that TabNavigation component renders correctly with proper structure
   */
  describe('Rendering', () => {
    it('should render without throwing errors', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      expect(container).toBeInTheDocument();
    });

    it('should render container div with flex class', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer).toBeInTheDocument();
      expect(navContainer).toHaveClass('flex', 'border-b', 'border-gray-200', 'mb-4');
    });

    it('should render two tab buttons', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });

    it('should have correct component structure: div > button + button', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer?.tagName).toBe('DIV');
      
      const buttons = navContainer?.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render only one container div', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const divs = container.querySelectorAll('div');
      expect(divs).toHaveLength(1);
    });

    it('should render only two button elements', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });

    it('should not have any inline styles', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      const buttons = container.querySelectorAll('button');

      expect(navContainer).not.toHaveAttribute('style');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('style');
      });
    });

    it('should not have any data-testid attributes', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      const buttons = container.querySelectorAll('button');

      expect(navContainer).not.toHaveAttribute('data-testid');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('data-testid');
      });
    });
  });

  /**
   * Tab Display Tests
   * Verify that tabs are displayed correctly with proper labels and icons
   */
  describe('Tab Display', () => {
    it('should display Search tab with emoji icon', () => {
      // Arrange & Act
      render(<TabNavigation />);

      // Assert
      const searchTab = screen.getByText('🔍 Search');
      expect(searchTab).toBeInTheDocument();
    });

    it('should display Wishlist tab with emoji icon', () => {
      // Arrange & Act
      render(<TabNavigation />);

      // Assert
      const wishlistTab = screen.getByText('📋 Wishlist');
      expect(wishlistTab).toBeInTheDocument();
    });

    it('should have correct tab labels', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveTextContent('🔍 Search');
      expect(buttons[1]).toHaveTextContent('📋 Wishlist');
    });

    it('should have emoji icons in tabs', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveTextContent('🔍');
      expect(buttons[1]).toHaveTextContent('📋');
    });

    it('should have tabs in correct order (Search first, Wishlist second)', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveTextContent('🔍 Search');
      expect(buttons[1]).toHaveTextContent('📋 Wishlist');
    });
  });

  /**
   * Active Tab Tests
   * Verify that active tab state is displayed correctly
   */
  describe('Active Tab State', () => {
    it('should have Search tab active by default', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should have Wishlist tab inactive by default', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[1]).toHaveClass('text-gray-600', 'hover:text-gray-800');
      expect(buttons[1]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should have only one active tab at a time', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      const activeButtons = Array.from(buttons).filter(button =>
        button.classList.contains('text-blue-600')
      );
      expect(activeButtons).toHaveLength(1);
    });

    it('should have correct active tab styling for Search tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      const searchTab = buttons[0];
      
      expect(searchTab).toHaveClass(
        'flex-1',
        'py-3',
        'text-center',
        'font-medium',
        'transition-colors',
        'text-blue-600',
        'border-b-2',
        'border-blue-600'
      );
    });

    it('should have correct inactive tab styling for Wishlist tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      const wishlistTab = buttons[1];
      
      expect(wishlistTab).toHaveClass(
        'flex-1',
        'py-3',
        'text-center',
        'font-medium',
        'transition-colors',
        'text-gray-600',
        'hover:text-gray-800'
      );
      expect(wishlistTab).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });

  /**
   * User Interaction Tests
   * Verify that user interactions work correctly
   */
  describe('User Interactions', () => {
    it('should switch to Wishlist tab when clicking Wishlist tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(buttons[0]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should switch to Search tab when clicking Search tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - First switch to wishlist, then back to search
      await user.click(buttons[1]);
      await user.click(buttons[0]);

      // Assert
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(buttons[1]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should change active tab when clicking different tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should maintain only one active tab after clicking', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);

      // Assert
      const activeButtons = Array.from(buttons).filter(button =>
        button.classList.contains('text-blue-600')
      );
      expect(activeButtons).toHaveLength(1);
    });

    it('should handle clicking active tab (no change)', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Click already active Search tab
      await user.click(buttons[0]);

      // Assert
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(buttons[1]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle rapid tab switching', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Rapid switching
      await user.click(buttons[1]);
      await user.click(buttons[0]);
      await user.click(buttons[1]);
      await user.click(buttons[0]);

      // Assert
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(buttons[1]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });

  /**
   * State Management Tests
   * Verify that component manages local state correctly
   */
  describe('State Management', () => {
    it('should initialize with search tab as active', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should update active tab state when clicking Wishlist tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should update active tab state when clicking Search tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);
      await user.click(buttons[0]);

      // Assert
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should maintain active tab state across re-renders', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container, rerender } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);
      rerender(<TabNavigation />);

      // Assert
      const newButtons = container.querySelectorAll('button');
      expect(newButtons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });

  /**
   * Accessibility Tests
   * Verify that component is accessible to all users
   */
  describe('Accessibility', () => {
    it('should have proper button semantics', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have accessible button text', () => {
      // Arrange & Act
      render(<TabNavigation />);

      // Assert
      expect(screen.getByText('🔍 Search')).toBeInTheDocument();
      expect(screen.getByText('📋 Wishlist')).toBeInTheDocument();
    });

    it('should be visible to screen readers', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      const buttons = container.querySelectorAll('button');

      expect(navContainer).toBeVisible();
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should not have aria-hidden attribute', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      const buttons = container.querySelectorAll('button');

      expect(navContainer).not.toHaveAttribute('aria-hidden');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('aria-hidden');
      });
    });

    it('should have proper keyboard navigation - Tab key', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Act
      await user.tab();

      // Assert - First button should be focused
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveFocus();
    });

    it('should have proper keyboard navigation - Enter key to activate', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Focus first button and press Enter
      buttons[0].focus();
      await user.keyboard('{Enter}');

      // Assert - Search tab should still be active (no change)
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should have proper keyboard navigation - Space key to activate', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Focus second button and press Space
      buttons[1].focus();
      await user.keyboard(' ');

      // Assert - Wishlist tab should be active
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should navigate between tabs with Tab key', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Act
      await user.tab();
      await user.tab();

      // Assert - Second button should be focused
      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveFocus();
    });

    it('should not have disabled attributes', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
        expect(button).not.toHaveAttribute('disabled');
      });
    });
  });

  /**
   * Styling Tests
   * Verify that component has correct styling
   */
  describe('Styling', () => {
    it('should have correct CSS classes on container', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer).toHaveClass(
        'flex',
        'border-b',
        'border-gray-200',
        'mb-4'
      );
    });

    it('should have correct CSS classes on Search tab when active', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass(
        'flex-1',
        'py-3',
        'text-center',
        'font-medium',
        'transition-colors',
        'text-blue-600',
        'border-b-2',
        'border-blue-600'
      );
    });

    it('should have correct CSS classes on Wishlist tab when inactive', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[1]).toHaveClass(
        'flex-1',
        'py-3',
        'text-center',
        'font-medium',
        'transition-colors',
        'text-gray-600',
        'hover:text-gray-800'
      );
    });

    it('should have correct CSS classes on Wishlist tab when active', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(buttons[1]).toHaveClass(
        'flex-1',
        'py-3',
        'text-center',
        'font-medium',
        'transition-colors',
        'text-blue-600',
        'border-b-2',
        'border-blue-600'
      );
    });

    it('should have correct CSS classes on Search tab when inactive', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[1]);

      // Assert
      expect(buttons[0]).toHaveClass(
        'flex-1',
        'py-3',
        'text-center',
        'font-medium',
        'transition-colors',
        'text-gray-600',
        'hover:text-gray-800'
      );
    });

    it('should have flex layout on container', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer).toHaveClass('flex');
    });

    it('should have flex-1 on both tabs', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('flex-1');
      expect(buttons[1]).toHaveClass('flex-1');
    });

    it('should have py-3 padding on both tabs', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('py-3');
      expect(buttons[1]).toHaveClass('py-3');
    });

    it('should have text-center on both tabs', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('text-center');
      expect(buttons[1]).toHaveClass('text-center');
    });

    it('should have font-medium on both tabs', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('font-medium');
      expect(buttons[1]).toHaveClass('font-medium');
    });

    it('should have transition-colors on both tabs', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('transition-colors');
      expect(buttons[1]).toHaveClass('transition-colors');
    });

    it('should have correct text color for active tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('text-blue-600');
    });

    it('should have correct text color for inactive tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[1]).toHaveClass('text-gray-600');
    });

    it('should have border-b-2 and border-blue-600 on active tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('border-b-2', 'border-blue-600');
    });

    it('should not have border-b-2 on inactive tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[1]).not.toHaveClass('border-b-2');
    });

    it('should have hover:text-gray-800 on inactive tab', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const buttons = container.querySelectorAll('button');
      expect(buttons[1]).toHaveClass('hover:text-gray-800');
    });

    it('should have border-b on container', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer).toHaveClass('border-b');
    });

    it('should have border-gray-200 on container', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer).toHaveClass('border-gray-200');
    });

    it('should have mb-4 margin on container', () => {
      // Arrange & Act
      const { container } = render(<TabNavigation />);

      // Assert
      const navContainer = container.firstChild as HTMLElement;
      expect(navContainer).toHaveClass('mb-4');
    });
  });

  /**
   * Edge Cases
   * Verify that component handles edge cases correctly
   */
  describe('Edge Cases', () => {
    it('should handle rapid tab switching without errors', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Very rapid switching (10 iterations: 0,1,0,1,0,1,0,1,0,1)
      for (let i = 0; i < 10; i++) {
        await user.click(buttons[i % 2]);
      }

      // Assert - Last clicked tab (buttons[1]) should be active
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(buttons[0]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle component unmount during interaction', () => {
      // Arrange
      const { unmount } = render(<TabNavigation />);

      // Act & Assert - Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component remount', () => {
      // Arrange
      const { unmount } = render(<TabNavigation />);

      // Act
      unmount();
      render(<TabNavigation />);

      // Assert - Should render without errors
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });

    it('should handle multiple rapid re-renders', () => {
      // Arrange
      const { rerender } = render(<TabNavigation />);

      // Act - Rapid re-renders
      for (let i = 0; i < 10; i++) {
        expect(() => rerender(<TabNavigation />)).not.toThrow();
      }

      // Assert
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render consistently across multiple renders', () => {
      // Arrange
      const { container: container1 } = render(<TabNavigation />);

      // Act
      const { container: container2 } = render(<TabNavigation />);

      // Assert
      const nav1 = container1.firstChild as HTMLElement;
      const nav2 = container2.firstChild as HTMLElement;

      expect(nav1?.className).toBe(nav2?.className);
      expect(nav1?.innerHTML).toBe(nav2?.innerHTML);
    });

    it('should handle multiple instances of TabNavigation', () => {
      // Arrange & Act
      const { container } = render(
        <>
          <TabNavigation />
          <TabNavigation />
        </>
      );

      // Assert
      const navContainers = container.querySelectorAll('div.flex');
      expect(navContainers).toHaveLength(2);
    });

    it('should handle clicking both tabs in sequence', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act
      await user.click(buttons[0]);
      await user.click(buttons[1]);
      await user.click(buttons[0]);
      await user.click(buttons[1]);

      // Assert
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should maintain state after multiple interactions', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Multiple interactions
      await user.click(buttons[1]);
      await user.click(buttons[0]);
      await user.click(buttons[1]);

      // Assert - Wishlist should still be active
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
      expect(buttons[0]).not.toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should handle clicking with mouse and keyboard', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Mouse click
      await user.click(buttons[1]);

      // Assert - Wishlist active
      expect(buttons[1]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');

      // Act - Keyboard (Space)
      buttons[0].focus();
      await user.keyboard(' ');

      // Assert - Search active
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });

    it('should not throw errors when clicking same tab multiple times', async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<TabNavigation />);
      const buttons = container.querySelectorAll('button');

      // Act - Click same tab multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(buttons[0]);
      }

      // Assert - Should complete without errors
      expect(buttons[0]).toHaveClass('text-blue-600', 'border-b-2', 'border-blue-600');
    });
  });
});
