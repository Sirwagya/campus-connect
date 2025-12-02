import { useState, useCallback, useEffect } from 'react';

type SetValue<T> = T | ((prev: T) => T);

/**
 * Hook for persisting state in localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Get stored value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Set value
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save to state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          
          // Dispatch custom event for cross-tab sync
          window.dispatchEvent(
            new StorageEvent('storage', {
              key,
              newValue: JSON.stringify(valueToStore),
            })
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing localStorage value for "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for persisting state in sessionStorage
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Utility functions for direct localStorage access
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  },
};

/**
 * Hook for storing user preferences
 */
interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  reducedMotion?: boolean;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  language?: string;
  notifications?: boolean;
  [key: string]: unknown;
}

const PREFERENCES_KEY = 'campus-connect-preferences';

export function usePreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage<UserPreferences>(
    PREFERENCES_KEY,
    {}
  );

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [setPreferences]
  );

  return {
    preferences,
    setPreferences,
    updatePreference,
    clearPreferences,
  };
}

/**
 * Hook for recently viewed items
 */
export function useRecentItems<T extends { id: string | number }>(
  key: string,
  maxItems: number = 10
) {
  const [items, setItems] = useLocalStorage<T[]>(key, []);

  const addItem = useCallback(
    (item: T) => {
      setItems((prev) => {
        // Remove existing if present
        const filtered = prev.filter((i) => i.id !== item.id);
        // Add to front and limit length
        return [item, ...filtered].slice(0, maxItems);
      });
    },
    [maxItems, setItems]
  );

  const removeItem = useCallback(
    (id: string | number) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems]
  );

  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    removeItem,
    clearItems,
  };
}
