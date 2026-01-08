import { FileStorage } from './file.storage';
import { SQLiteStorage } from './sqlite.storage';
import { Storage } from './storage.interface';
import logger from '@/utils/logger';

// Storage type from environment variable (default: 'sqlite')
const storageType = process.env.STORAGE_TYPE || 'sqlite';

// Storage paths from environment or defaults
const storagePath = process.env.STORAGE_PATH || './data';
const databasePath = process.env.DATABASE_PATH || './data/wishlist.db';

// Initialize storage instances based on storage type
let wishlistStorage: Storage<any>;
let userStorage: Storage<any>;

switch (storageType.toLowerCase()) {
  case 'file':
    logger.info('Using File-based storage');
    wishlistStorage = new FileStorage<any>(storagePath);
    userStorage = new FileStorage<any>(storagePath);
    break;
  
  case 'sqlite':
  default:
    logger.info('Using SQLite storage with WAL mode');
    wishlistStorage = new SQLiteStorage<any>(databasePath);
    userStorage = new SQLiteStorage<any>(databasePath);
    break;
}

// Export storage instances
export { wishlistStorage, userStorage };

// Export storage classes and interface
export { FileStorage, SQLiteStorage, Storage };

// Export default storage (wishlist storage)
export default wishlistStorage;

// Export storage type for reference
export const CURRENT_STORAGE_TYPE = storageType;
