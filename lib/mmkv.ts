import { MMKV } from 'react-native-mmkv';

/**
 * Initialize MMKV storage instance
 * This provides fast, synchronous key-value storage for offline-first architecture
 */
export const storage = new MMKV({
  id: 'rung-score-keeper',
  encryptionKey: undefined, // Can add encryption later if needed
});

/**
 * Storage keys used throughout the app
 */
export const StorageKeys = {
  CURRENT_GAME: 'current_game',
  OFFLINE_QUEUE: 'offline_queue',
  THEME: 'theme',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

/**
 * Helper functions for common storage operations
 */
export const storageHelpers = {
  // Get a JSON object from storage
  getObject: <T>(key: string): T | null => {
    const jsonString = storage.getString(key);
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error(`Error parsing JSON from storage key ${key}:`, error);
      return null;
    }
  },

  // Set a JSON object to storage
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Remove a key from storage
  remove: (key: string): void => {
    storage.delete(key);
  },

  // Clear all storage
  clearAll: (): void => {
    storage.clearAll();
  },

  // Check if a key exists
  contains: (key: string): boolean => {
    return storage.contains(key);
  },
};
