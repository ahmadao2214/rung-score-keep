import { useState, useEffect, useCallback } from 'react';
import { storage } from '../mmkv';

/**
 * React hook for using MMKV storage with automatic re-rendering
 * Similar to useState but persisted in MMKV
 */
export function useMMKVString(key: string, defaultValue?: string) {
  const [value, setValue] = useState<string | undefined>(() => {
    const stored = storage.getString(key);
    return stored ?? defaultValue;
  });

  const updateValue = useCallback(
    (newValue: string | undefined) => {
      if (newValue === undefined) {
        storage.delete(key);
        setValue(undefined);
      } else {
        storage.set(key, newValue);
        setValue(newValue);
      }
    },
    [key]
  );

  return [value, updateValue] as const;
}

/**
 * Hook for boolean values
 */
export function useMMKVBoolean(key: string, defaultValue?: boolean) {
  const [value, setValue] = useState<boolean>(() => {
    const stored = storage.getBoolean(key);
    return stored ?? defaultValue ?? false;
  });

  const updateValue = useCallback(
    (newValue: boolean) => {
      storage.set(key, newValue);
      setValue(newValue);
    },
    [key]
  );

  return [value, updateValue] as const;
}

/**
 * Hook for number values
 */
export function useMMKVNumber(key: string, defaultValue?: number) {
  const [value, setValue] = useState<number | undefined>(() => {
    const stored = storage.getNumber(key);
    return stored ?? defaultValue;
  });

  const updateValue = useCallback(
    (newValue: number | undefined) => {
      if (newValue === undefined) {
        storage.delete(key);
        setValue(undefined);
      } else {
        storage.set(key, newValue);
        setValue(newValue);
      }
    },
    [key]
  );

  return [value, updateValue] as const;
}

/**
 * Hook for object/JSON values
 */
export function useMMKVObject<T>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(() => {
    const stored = storage.getString(key);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  });

  const updateValue = useCallback(
    (newValue: T | undefined) => {
      if (newValue === undefined) {
        storage.delete(key);
        setValue(undefined);
      } else {
        storage.set(key, JSON.stringify(newValue));
        setValue(newValue);
      }
    },
    [key]
  );

  return [value, updateValue] as const;
}
