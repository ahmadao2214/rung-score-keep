import { Platform } from 'react-native';

// Web polyfill for MMKV using localStorage
const createWebStorage = () => ({
  set: (key: string, value: string | number | boolean) => {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Failed to set localStorage:', error);
    }
  },
  getString: (key: string): string | undefined => {
    try {
      return localStorage.getItem(key) || undefined;
    } catch {
      return undefined;
    }
  },
  getNumber: (key: string): number | undefined => {
    try {
      const value = localStorage.getItem(key);
      return value ? Number(value) : undefined;
    } catch {
      return undefined;
    }
  },
  getBoolean: (key: string): boolean | undefined => {
    try {
      const value = localStorage.getItem(key);
      return value ? value === 'true' : undefined;
    } catch {
      return undefined;
    }
  },
  delete: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }
  },
  clearAll: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
  contains: (key: string): boolean => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
});

/**
 * Initialize MMKV storage instance (or localStorage polyfill on web)
 * This provides fast, synchronous key-value storage for offline-first architecture
 */
let storage: any;

if (Platform.OS === 'web') {
  // Use localStorage on web
  storage = createWebStorage();
} else {
  // Use native MMKV on mobile
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({
    id: 'rung-score-keeper',
    encryptionKey: undefined,
  });
}

export { storage };

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
