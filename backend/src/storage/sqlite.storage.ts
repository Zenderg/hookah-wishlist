import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import logger from '@/utils/logger';
import { Storage } from './storage.interface';

/**
 * SQLite storage implementation with WAL mode for better concurrency and performance.
 * Implements the Storage<T> interface for persistent data storage.
 */
export class SQLiteStorage<T> implements Storage<T> {
  private db: Database.Database;
  private cache: Map<string, T> = new Map();

  constructor(dbPath: string) {
    this.db = this.initializeDatabase(dbPath);
    this.createTables();
    this.enableWALMode();
    logger.info(`SQLite storage initialized at: ${dbPath}`);
  }

  /**
   * Initialize database connection with proper error handling
   */
  private initializeDatabase(dbPath: string): Database.Database {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.debug(`Created database directory: ${dbDir}`);
      }

      // Open database connection with WAL mode enabled
      const db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? logger.debug : undefined,
      });

      // Set database pragmas for better performance
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = -64000'); // 64MB cache
      db.pragma('temp_store = MEMORY');

      logger.debug(`Database connection established: ${dbPath}`);
      return db;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Enable WAL (Write-Ahead Logging) mode for better concurrency and performance
   */
  private enableWALMode(): void {
    try {
      const result = this.db.pragma('journal_mode', { simple: true });
      logger.info(`WAL mode enabled: ${result}`);
    } catch (error) {
      logger.error('Failed to enable WAL mode:', error);
      throw error;
    }
  }

  /**
   * Create database tables and indexes if they don't exist
   */
  private createTables(): void {
    try {
      // Create wishlists table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS wishlists (
          user_id TEXT PRIMARY KEY NOT NULL,
          items TEXT NOT NULL,
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // Create index on updated_at for performance
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_wishlists_updated_at 
        ON wishlists(updated_at)
      `);

      logger.debug('Database tables and indexes created/verified');
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    }
  }

  /**
   * Retrieve value by key from database
   */
  async get(key: string): Promise<T | null> {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        logger.debug(`Cache hit for key: ${key}`);
        return this.cache.get(key)!;
      }

      // Query database
      const stmt = this.db.prepare(`
        SELECT items FROM wishlists WHERE user_id = ?
      `);
      
      const row = stmt.get(key) as { items: string } | undefined;
      
      if (!row) {
        logger.debug(`Key not found: ${key}`);
        return null;
      }

      // Parse JSON value
      const value = JSON.parse(row.items) as T;
      
      // Update cache
      this.cache.set(key, value);
      
      logger.debug(`Retrieved value for key: ${key}`);
      return value;
    } catch (error) {
      logger.error(`Error getting value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set value by key in database
   */
  async set(key: string, value: T): Promise<void> {
    try {
      const itemsJson = JSON.stringify(value);
      const now = new Date().toISOString();

      // Use upsert (INSERT OR REPLACE) to handle both new and existing records
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO wishlists (user_id, items, updated_at, created_at)
        VALUES (?, ?, ?, COALESCE((SELECT created_at FROM wishlists WHERE user_id = ?), ?))
      `);
      
      stmt.run(key, itemsJson, now, key, now);
      
      // Update cache
      this.cache.set(key, value);
      
      logger.debug(`Set value for key: ${key}`);
    } catch (error) {
      logger.error(`Error setting value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete value by key from database
   */
  async delete(key: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM wishlists WHERE user_id = ?
      `);
      
      const result = stmt.run(key);
      
      // Remove from cache
      this.cache.delete(key);
      
      if (result.changes > 0) {
        logger.debug(`Deleted value for key: ${key}`);
      } else {
        logger.debug(`Key not found for deletion: ${key}`);
      }
    } catch (error) {
      logger.error(`Error deleting value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists in database
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return true;
      }

      const stmt = this.db.prepare(`
        SELECT 1 FROM wishlists WHERE user_id = ? LIMIT 1
      `);
      
      const row = stmt.get(key);
      return row !== undefined;
    } catch (error) {
      logger.error(`Error checking existence for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all data from database
   */
  async clear(): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM wishlists
      `);
      
      const result = stmt.run();
      
      // Clear cache
      this.cache.clear();
      
      logger.info(`Cleared ${result.changes} records from database`);
    } catch (error) {
      logger.error('Error clearing database:', error);
      throw error;
    }
  }

  /**
   * Clear in-memory cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('SQLite storage cache cleared');
  }

  /**
   * Get database statistics
   */
  getStats(): { count: number; walMode: string } {
    try {
      const countStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM wishlists
      `);
      const countResult = countStmt.get() as { count: number };
      
      const walMode = this.db.pragma('journal_mode', { simple: true }) as string;
      
      return {
        count: countResult.count,
        walMode,
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    try {
      this.db.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Perform database checkpoint to clean up WAL files
   */
  checkpoint(): void {
    try {
      this.db.pragma('wal_checkpoint(TRUNCATE)');
      logger.debug('WAL checkpoint completed');
    } catch (error) {
      logger.error('Error performing WAL checkpoint:', error);
      throw error;
    }
  }
}
