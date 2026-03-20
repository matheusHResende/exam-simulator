/**
 * Returns the localStorage key used to persist a user's Python code
 * for a particular problem in an exam.
 *
 * Pattern: `prog_code_<storageKey>_<index>`
 */
export function makeCodeKey(storageKey: string, index: number) {
  return `prog_code_${storageKey}_${index}`;
}

/**
 * Returns the localStorage key used to persist the test-case results
 * for a particular problem in an exam.
 *
 * Pattern: `prog_results_<storageKey>_<index>`
 */
export function makeResultsKey(storageKey: string, index: number) {
  return `prog_results_${storageKey}_${index}`;
}

/**
 * Derives a stable, URL-safe localStorage namespace from an exam or file title.
 *
 * Converts the title to lowercase, replaces non-alphanumeric runs with
 * underscores, strips leading/trailing underscores, and truncates to 40
 * characters.
 *
 * @example
 * makeStorageKey('Meu Simulado!')  // → 'meu_simulado'
 */
export function makeStorageKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

/**
 * Reads and JSON-parses a value from localStorage.
 *
 * Returns `null` during SSR (server-side rendering) or if the key does not
 * exist or the stored value cannot be parsed.
 *
 * @param key - The localStorage key to read.
 */
export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * JSON-serialises `value` and writes it to localStorage.
 *
 * No-ops during SSR or when the storage quota is exceeded (quota errors are
 * silently swallowed to avoid crashing the UI).
 *
 * @param key - The localStorage key to write.
 * @param value - Any JSON-serialisable value.
 */
export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}
