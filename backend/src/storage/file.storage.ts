import fs from 'fs/promises';
import path from 'path';
import logger from '@/utils/logger';
import { Storage } from './storage.interface';

export class FileStorage<T> implements Storage<T> {
  private storagePath: string;
  private cache: Map<string, T> = new Map();

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    // Synchronously ensure directory exists to avoid race conditions
    fs.mkdir(storagePath, { recursive: true }).catch((error) => {
      logger.error('Error creating storage directory:', error);
    });
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal and nested directory issues
    // Replace slashes and backslashes with underscores
    const sanitizedKey = key.replace(/[\/\\]/g, '_');
    return path.join(this.storagePath, `${sanitizedKey}.json`);
  }

  async get(key: string): Promise<T | null> {
    // Check cache first
    if (this.cache.has(key)) {
      logger.debug(`Cache hit for key: ${key}`);
      return this.cache.get(key)!;
    }

    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const value = JSON.parse(data) as T;
      
      // Update cache
      this.cache.set(key, value);
      
      logger.debug(`Retrieved value for key: ${key}`);
      return value;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug(`Key not found: ${key}`);
        return null;
      }
      logger.error(`Error getting value for key ${key}:`, error);
      throw error;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const data = JSON.stringify(value, null, 2);
      
      await fs.writeFile(filePath, data, 'utf-8');
      
      // Update cache
      this.cache.set(key, value);
      
      logger.debug(`Set value for key: ${key}`);
    } catch (error) {
      logger.error(`Error setting value for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      
      // Remove from cache
      this.cache.delete(key);
      
      logger.debug(`Deleted value for key: ${key}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug(`Key not found for deletion: ${key}`);
        return;
      }
      logger.error(`Error deleting value for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.storagePath, file));
        }
      }
      
      // Clear cache
      this.cache.clear();
      
      logger.info('Storage cleared');
    } catch (error) {
      logger.error('Error clearing storage:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    logger.debug('Storage cache cleared');
  }
}
