import { FileStorage } from './file.storage';
import { Storage } from './storage.interface';

// Initialize storage with path from environment or default
const storagePath = process.env.STORAGE_PATH || './data';

// Create storage instances with proper types
export const wishlistStorage = new FileStorage<any>(storagePath);
export const userStorage = new FileStorage<any>(storagePath);

export { FileStorage, Storage };
export default wishlistStorage;
