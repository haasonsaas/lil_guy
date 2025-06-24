import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Custom hook for managing localStorage with React state
 * Automatically syncs between tabs and handles SSR
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, SetValue<T>, () => void] {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // Get from localStorage or use default
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) return defaultValue;
      
      // Try to deserialize the value
      try {
        return deserialize(item);
      } catch (deserializeError) {
        // If deserialization fails and we're using JSON.parse,
        // it might be a plain string that needs migration
        if (deserialize === JSON.parse) {
          console.warn(`Migrating non-JSON value for key "${key}"`);
          // Store it properly as JSON for next time
          window.localStorage.setItem(key, JSON.stringify(item));
          return item as unknown as T;
        }
        throw deserializeError;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Update localStorage when state changes
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(valueToStore));
        
        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  // Clear the stored value
  const clearValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(defaultValue);
        
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, value: null }
        }));
      }
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value for "${key}":`, error);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value ?? defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleCustomEvent);
    };
  }, [key, defaultValue, deserialize]);

  return [storedValue, setValue, clearValue];
}

// Typed versions for common use cases
export function useLocalStorageBoolean(key: string, defaultValue = false) {
  return useLocalStorage<boolean>(key, defaultValue);
}

export function useLocalStorageNumber(key: string, defaultValue = 0) {
  return useLocalStorage<number>(key, defaultValue);
}

export function useLocalStorageString(key: string, defaultValue = '') {
  return useLocalStorage<string>(key, defaultValue);
}