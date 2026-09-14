// Crash-proof safe storage wrapper with in-memory fallback
// Protects against Sandboxed iframes, private browsing, and SecurityError

const memoryStore: Record<string, string> = {};

const isStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__test_storage_access__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hasLocalStorage = isStorageAvailable();

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (hasLocalStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      } catch (err) {
        console.warn(`[Storage] Read error for ${key}:`, err);
      }
    }
    return memoryStore[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    memoryStore[key] = value;
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        console.warn(`[Storage] Write error for ${key}:`, err);
      }
    }
  },

  removeItem: (key: string): void => {
    delete memoryStore[key];
    if (hasLocalStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[Storage] Delete error for ${key}:`, err);
      }
    }
  },
};
