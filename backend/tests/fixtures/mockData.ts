/**
 * Mock data factories and sample test data
 */

import { User } from '@/models/user';
import { Wishlist, WishlistItem } from '@/models/wishlist';
import { Tobacco } from '@/models/tobacco';

/**
 * Factory function to create a User object
 */
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: 123456789,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  languageCode: 'en',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Factory function to create a WishlistItem object
 */
export const createWishlistItem = (overrides: Partial<WishlistItem> = {}): WishlistItem => ({
  tobaccoId: '1',
  addedAt: new Date().toISOString(),
  notes: 'Test note',
  ...overrides,
});

/**
 * Factory function to create a Wishlist object
 */
export const createWishlist = (overrides: Partial<Wishlist> = {}): Wishlist => ({
  userId: 123456789,
  items: [createWishlistItem()],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Factory function to create a Tobacco object
 */
export const createTobacco = (overrides: Partial<Tobacco> = {}): Tobacco => ({
  id: '1',
  name: 'Mint',
  brand: 'Al Fakher',
  flavor: 'Mint',
  description: 'Classic mint flavor',
  strength: 'medium',
  image: 'https://example.com/mint.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Sample users array
 */
export const sampleUsers: User[] = [
  {
    id: 123456789,
    username: 'testuser1',
    firstName: 'Test',
    lastName: 'User One',
    languageCode: 'en',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastActiveAt: '2024-01-10T12:00:00.000Z',
  },
  {
    id: 987654321,
    username: 'testuser2',
    firstName: 'Test',
    lastName: 'User Two',
    languageCode: 'ru',
    createdAt: '2024-01-02T00:00:00.000Z',
    lastActiveAt: '2024-01-10T11:00:00.000Z',
  },
];

/**
 * Sample wishlists array
 */
export const sampleWishlists: Wishlist[] = [
  {
    userId: 123456789,
    items: [
      {
        tobaccoId: '1',
        addedAt: '2024-01-05T10:00:00.000Z',
        notes: 'Favorite mint flavor',
      },
      {
        tobaccoId: '2',
        addedAt: '2024-01-06T10:00:00.000Z',
        notes: 'Try this soon',
      },
    ],
    createdAt: '2024-01-05T10:00:00.000Z',
    updatedAt: '2024-01-06T10:00:00.000Z',
  },
  {
    userId: 987654321,
    items: [
      {
        tobaccoId: '3',
        addedAt: '2024-01-07T10:00:00.000Z',
      },
    ],
    createdAt: '2024-01-07T10:00:00.000Z',
    updatedAt: '2024-01-07T10:00:00.000Z',
  },
];

/**
 * Sample tobaccos array
 */
export const sampleTobaccos: Tobacco[] = [
  {
    id: '1',
    name: 'Mint',
    brand: 'Al Fakher',
    flavor: 'Mint',
    description: 'Classic mint flavor with a refreshing taste',
    strength: 'medium',
    image: 'https://example.com/mint.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Double Apple',
    brand: 'Al Fakher',
    flavor: 'Apple',
    description: 'Sweet and sour apple blend',
    strength: 'medium',
    image: 'https://example.com/apple.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Blueberry',
    brand: 'Starbuzz',
    flavor: 'Blueberry',
    description: 'Fresh blueberry taste with a smooth finish',
    strength: 'light',
    image: 'https://example.com/blueberry.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'Cane Mint',
    brand: 'Tangiers',
    flavor: 'Mint',
    description: 'Strong mint flavor with a unique cane taste',
    strength: 'strong',
    image: 'https://example.com/cane-mint.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    name: 'Grape',
    brand: 'Nakhla',
    flavor: 'Grape',
    description: 'Sweet grape flavor',
    strength: 'medium',
    image: 'https://example.com/grape.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Sample brands array
 */
export const sampleBrands: string[] = [
  'Al Fakher',
  'Starbuzz',
  'Tangiers',
  'Nakhla',
  'Fumari',
];

/**
 * Sample flavors array
 */
export const sampleFlavors: string[] = [
  'Mint',
  'Apple',
  'Blueberry',
  'Grape',
  'Watermelon',
  'Peach',
  'Lemon',
  'Orange',
  'Strawberry',
  'Cherry',
];

/**
 * Helper to create multiple users
 */
export const createUsers = (count: number, startId: number = 100000000): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createUser({
      id: startId + index,
      username: `testuser${index}`,
      firstName: `Test${index}`,
      lastName: `User${index}`,
    })
  );
};

/**
 * Helper to create multiple wishlists
 */
export const createWishlists = (count: number, startUserId: number = 100000000): Wishlist[] => {
  return Array.from({ length: count }, (_, index) =>
    createWishlist({
      userId: startUserId + index,
      items: [
        createWishlistItem({
          tobaccoId: `${(index % 5) + 1}`,
        }),
      ],
    })
  );
};

/**
 * Helper to create multiple tobaccos
 */
export const createTobaccos = (count: number, startId: number = 1): Tobacco[] => {
  const brands = ['Al Fakher', 'Starbuzz', 'Tangiers', 'Nakhla', 'Fumari'];
  const flavors = ['Mint', 'Apple', 'Blueberry', 'Grape', 'Watermelon'];
  const strengths: ('light' | 'medium' | 'strong')[] = ['light', 'medium', 'strong'];

  return Array.from({ length: count }, (_, index) =>
    createTobacco({
      id: `${startId + index}`,
      name: `${flavors[index % flavors.length]} ${index + 1}`,
      brand: brands[index % brands.length],
      flavor: flavors[index % flavors.length],
      strength: strengths[index % strengths.length],
    })
  );
};

/**
 * Helper to get tobacco by ID from sample data
 */
export const getTobaccoById = (id: string): Tobacco | undefined => {
  return sampleTobaccos.find((t) => t.id === id);
};

/**
 * Helper to get wishlist by user ID from sample data
 */
export const getWishlistByUserId = (userId: number): Wishlist | undefined => {
  return sampleWishlists.find((w) => w.userId === userId);
};

/**
 * Helper to get user by ID from sample data
 */
export const getUserById = (id: number): User | undefined => {
  return sampleUsers.find((u) => u.id === id);
};
