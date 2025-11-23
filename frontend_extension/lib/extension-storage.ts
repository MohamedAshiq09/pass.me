/**
 * Extension Storage Wrapper
 * Uses chrome.storage.local for extension context, falls back to localStorage for web
 */

// Check if we're in a Chrome extension context
export const isExtensionContext = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.storage !== 'undefined' &&
         typeof chrome.storage.local !== 'undefined';
};

/**
 * Get item from storage (async)
 */
export async function getStorageItem<T>(key: string): Promise<T | null> {
  if (isExtensionContext()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] ?? null);
      });
    });
  } else {
    // Fallback to localStorage for web
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }
}

/**
 * Set item in storage (async)
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  if (isExtensionContext()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  } else {
    // Fallback to localStorage for web
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Remove item from storage (async)
 */
export async function removeStorageItem(key: string): Promise<void> {
  if (isExtensionContext()) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  } else {
    // Fallback to localStorage for web
    localStorage.removeItem(key);
  }
}

/**
 * Clear all extension storage (async)
 */
export async function clearStorage(): Promise<void> {
  if (isExtensionContext()) {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  } else {
    // Fallback to localStorage for web
    localStorage.clear();
  }
}

/**
 * Get multiple items from storage (async)
 */
export async function getStorageItems<T extends Record<string, unknown>>(keys: string[]): Promise<Partial<T>> {
  if (isExtensionContext()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result as Partial<T>);
      });
    });
  } else {
    // Fallback to localStorage for web
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          result[key] = JSON.parse(item);
        } catch {
          result[key] = item;
        }
      }
    }
    return result as Partial<T>;
  }
}

/**
 * Set multiple items in storage (async)
 */
export async function setStorageItems(items: Record<string, unknown>): Promise<void> {
  if (isExtensionContext()) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, () => {
        resolve();
      });
    });
  } else {
    // Fallback to localStorage for web
    for (const [key, value] of Object.entries(items)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}
