/**
 * UUID generation utilities
 * Provides a crypto.randomUUID polyfill for environments where it's not available
 */

/**
 * Generate a random UUID v4
 * @returns UUID string
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation based on Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a simple ID suitable for DOM elements or non-critical identifiers
 * @param prefix Optional prefix for the ID
 * @returns ID string
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Install UUID polyfill globally
 * Call this early in your application to ensure crypto.randomUUID is available
 */
export function installUUIDPolyfill(): void {
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID !== 'function') {
      Object.defineProperty(crypto, 'randomUUID', {
        value: generateUUID,
        enumerable: false,
        configurable: true
      });
      console.info('UUID polyfill installed');
    }
  }
}

// Export default function for convenience
export default generateUUID;
