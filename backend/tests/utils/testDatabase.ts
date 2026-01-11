/**
 * Test database utilities for SQLite testing
 */

import Database from 'better-sqlite3';
import { Wishlist } from '@/models/wishlist';
import { sampleWishlists } from '../fixtures/mockData';

export interface TestDatabase {
  db: Database.Database;
  clear: () => void;
  seed: (data?: Wishlist[]) => void;
  close: () => void;
  getWishlist: (userId: number) => Wishlist | null;
  setWishlist: (userId: number, wishlist: Wishlist) => void;
  deleteWishlist: (userId: number) => void;
}

/**
 * Create an in-memory SQLite database for testing
 */
export const createTestDatabase = (): TestDatabase => {
  // Create in-memory database
  const db = new Database(':memory:', { verbose: undefined });

  // Enable WAL mode
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');

  // Create tables
  initializeSchema(db);

  return {
    db,
    clear: () => clearDatabase(db),
    seed: (data?: Wishlist[]) => seedDatabase(db, data),
    close: () => closeDatabase(db),
    getWishlist: (userId: number) => getWishlist(db, userId),
    setWishlist: (userId: number, wishlist: Wishlist) => setWishlist(db, userId, wishlist),
    deleteWishlist: (userId: number) => deleteWishlist(db, userId),
  };
};

/**
 * Initialize database schema
 */
export const initializeSchema = (db: Database.Database): void => {
  // Create wishlists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlists (
      user_id TEXT PRIMARY KEY NOT NULL,
      items TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
      created_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create index on updated_at for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wishlists_updated_at 
    ON wishlists(updated_at)
  `);
};

/**
 * Clear all data from database
 */
export const clearDatabase = (db: Database.Database): void => {
  db.exec('DELETE FROM wishlists');
};

/**
 * Seed database with sample data
 */
export const seedDatabase = (db: Database.Database, data: Wishlist[] = sampleWishlists): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO wishlists (user_id, items, updated_at, created_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const wishlist of data) {
    stmt.run(
      String(wishlist.userId),
      JSON.stringify(wishlist.items),
      wishlist.updatedAt,
      wishlist.createdAt
    );
  }
};

/**
 * Close database connection
 */
export const closeDatabase = (db: Database.Database): void => {
  try {
    db.close();
  } catch (error) {
    // Ignore errors if database is already closed
  }
};

/**
 * Get wishlist by user ID
 */
export const getWishlist = (db: Database.Database, userId: number): Wishlist | null => {
  const stmt = db.prepare(`
    SELECT items, updated_at, created_at FROM wishlists WHERE user_id = ?
  `);

  const row = stmt.get(String(userId)) as {
    items: string;
    updated_at: string;
    created_at: string;
  } | undefined;

  if (!row) {
    return null;
  }

  return {
    userId,
    items: JSON.parse(row.items),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
};

/**
 * Set wishlist for user ID
 */
export const setWishlist = (db: Database.Database, userId: number, wishlist: Wishlist): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO wishlists (user_id, items, updated_at, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(
    String(userId),
    JSON.stringify(wishlist.items),
    wishlist.updatedAt,
    wishlist.createdAt
  );
};

/**
 * Delete wishlist by user ID
 */
export const deleteWishlist = (db: Database.Database, userId: number): void => {
  const stmt = db.prepare(`
    DELETE FROM wishlists WHERE user_id = ?
  `);

  stmt.run(String(userId));
};

/**
 * Count wishlists in database
 */
export const countWishlists = (db: Database.Database): number => {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM wishlists');
  const result = stmt.get() as { count: number };
  return result.count;
};

/**
 * Check if wishlist exists for user ID
 */
export const wishlistExists = (db: Database.Database, userId: number): boolean => {
  const stmt = db.prepare('SELECT 1 FROM wishlists WHERE user_id = ? LIMIT 1');
  const row = stmt.get(String(userId));
  return row !== undefined;
};

/**
 * Get all wishlists from database
 */
export const getAllWishlists = (db: Database.Database): Wishlist[] => {
  const stmt = db.prepare('SELECT user_id, items, updated_at, created_at FROM wishlists');
  const rows = stmt.all() as Array<{
    user_id: string;
    items: string;
    updated_at: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    userId: parseInt(row.user_id, 10),
    items: JSON.parse(row.items),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }));
};
