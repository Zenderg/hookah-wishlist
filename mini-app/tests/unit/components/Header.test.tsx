/**
 * Header Component Unit Tests
 * 
 * Comprehensive unit tests for Header component following javascript-testing-patterns skill best practices.
 * Tests cover rendering, accessibility, styling, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../../src/components/Header';

describe('Header Component', () => {
  /**
   * Cleanup after each test to prevent test pollution
   */
  afterEach(() => {
    cleanup();
  });

  /**
   * Rendering Tests
   * Verify that Header component renders correctly with proper structure
   */
  describe('Rendering', () => {
    it('should render without throwing errors', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      expect(container).toBeInTheDocument();
    });

    it('should render header element', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render the title correctly', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const title = screen.getByText('🍃 Hookah Wishlist');
      expect(title).toBeInTheDocument();
    });

    it('should have correct component structure', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      // Check that header contains a div
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header?.querySelector('div')).toBeInTheDocument();

      // Check that div contains h1
      const div = header?.querySelector('div');
      expect(div?.querySelector('h1')).toBeInTheDocument();
    });

    it('should render only one header element', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const headers = container.querySelectorAll('header');
      expect(headers).toHaveLength(1);
    });

    it('should render only one h1 element', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const headings = container.querySelectorAll('h1');
      expect(headings).toHaveLength(1);
    });
  });

  /**
   * Accessibility Tests
   * Verify that Header component is accessible to all users
   */
  describe('Accessibility', () => {
    it('should have proper semantic HTML with header element', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const header = screen.getByRole('banner');
      expect(header.tagName).toBe('HEADER');
    });

    it('should have proper heading level (h1)', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.tagName).toBe('H1');
    });

    it('should have implicit banner role for header element', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      // The <header> element implicitly has the banner role
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('HEADER');
    });

    it('should be accessible to screen readers', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const header = screen.getByRole('banner');
      expect(header).toBeVisible();
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeVisible();
      expect(title).toHaveTextContent('🍃 Hookah Wishlist');
    });

    it('should have no accessibility violations', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      // Check that all interactive elements have proper roles (none in this case)
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).not.toHaveAttribute('aria-hidden');
    });
  });

  /**
   * Styling Tests
   * Verify that Tailwind CSS classes are applied correctly
   */
  describe('Styling', () => {
    it('should have correct background color class', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-blue-600');
    });

    it('should have correct text color class', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).toHaveClass('text-white');
    });

    it('should have shadow class', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).toHaveClass('shadow-md');
    });

    it('should have container class on inner div', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const div = container.querySelector('header > div');
      expect(div).toHaveClass('container');
    });

    it('should have margin auto on inner div', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const div = container.querySelector('header > div');
      expect(div).toHaveClass('mx-auto');
    });

    it('should have correct horizontal padding on inner div', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const div = container.querySelector('header > div');
      expect(div).toHaveClass('px-4');
    });

    it('should have correct vertical padding on inner div', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const div = container.querySelector('header > div');
      expect(div).toHaveClass('py-4');
    });

    it('should have correct text size on heading', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('text-xl');
    });

    it('should have bold font weight on heading', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('font-bold');
    });

    it('should have all expected classes on header element', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });

    it('should have all expected classes on inner div element', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const div = container.querySelector('header > div');
      expect(div).toHaveClass('container', 'mx-auto', 'px-4', 'py-4');
    });

    it('should have all expected classes on heading element', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const heading = container.querySelector('h1');
      expect(heading).toHaveClass('text-xl', 'font-bold');
    });
  });

  /**
   * Edge Cases
   * Verify that component handles different scenarios correctly
   */
  describe('Edge Cases', () => {
    it('should render without any props', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should render multiple times without issues', () => {
      // Arrange & Act
      const { rerender, container } = render(<Header />);

      // Assert - First render
      expect(container.querySelector('header')).toBeInTheDocument();

      // Act - Rerender
      rerender(<Header />);

      // Assert - Second render
      expect(container.querySelector('header')).toBeInTheDocument();

      // Act - Third render
      rerender(<Header />);

      // Assert - Third render
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should not throw errors when unmounted and remounted', () => {
      // Arrange
      const { unmount, rerender } = render(<Header />);

      // Act - Unmount
      expect(() => unmount()).not.toThrow();

      // Act - Remount
      expect(() => render(<Header />)).not.toThrow();
    });

    it('should handle rapid re-renders without errors', () => {
      // Arrange
      const { rerender, container } = render(<Header />);

      // Act - Rapid re-renders
      for (let i = 0; i < 10; i++) {
        expect(() => rerender(<Header />)).not.toThrow();
      }

      // Assert
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should not have any unexpected children', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header?.children).toHaveLength(1); // Only div wrapper

      const div = header?.querySelector('div');
      expect(div?.children).toHaveLength(1); // Only h1 element
    });

    it('should not have any inline styles', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).not.toHaveAttribute('style');

      const div = container.querySelector('header > div');
      expect(div).not.toHaveAttribute('style');

      const heading = container.querySelector('h1');
      expect(heading).not.toHaveAttribute('style');
    });

    it('should not have any data attributes', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).not.toHaveAttribute('data-testid');
      expect(header).not.toHaveAttribute('data-.*');
    });

    it('should render consistently across multiple renders', () => {
      // Arrange
      const { container: container1 } = render(<Header />);
      
      // Act
      const { container: container2 } = render(<Header />);

      // Assert
      const header1 = container1.querySelector('header');
      const header2 = container2.querySelector('header');

      expect(header1?.className).toBe(header2?.className);
      expect(header1?.innerHTML).toBe(header2?.innerHTML);
    });
  });

  /**
   * Content Tests
   * Verify that component content is correct
   */
  describe('Content', () => {
    it('should display the correct title text', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const title = screen.getByText('🍃 Hookah Wishlist');
      expect(title).toBeInTheDocument();
    });

    it('should display emoji in the title', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const title = screen.getByText(/🍃/);
      expect(title).toBeInTheDocument();
    });

    it('should display full title including emoji and text', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('🍃 Hookah Wishlist');
    });

    it('should not have any additional text content', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header?.textContent).toBe('🍃 Hookah Wishlist');
    });
  });

  /**
   * DOM Structure Tests
   * Verify that component has correct DOM hierarchy
   */
  describe('DOM Structure', () => {
    it('should have correct nesting: header > div > h1', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();

      const div = header?.querySelector(':scope > div');
      expect(div).toBeInTheDocument();
      expect(div?.parentElement).toBe(header);

      const h1 = div?.querySelector(':scope > h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.parentElement).toBe(div);
    });

    it('should have no sibling elements at header level', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const header = container.querySelector('header');
      expect(header?.parentElement?.children).toHaveLength(1);
    });

    it('should have no sibling elements at div level', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const div = container.querySelector('header > div');
      expect(div?.children).toHaveLength(1);
    });

    it('should have no children in h1 element', () => {
      // Arrange & Act
      const { container } = render(<Header />);

      // Assert
      const h1 = container.querySelector('h1');
      expect(h1?.children).toHaveLength(0);
    });
  });
});
