export function makeCodeKey(storageKey: string, index: number) {
  return `prog_code_${storageKey}_${index}`;
}

export function makeResultsKey(storageKey: string, index: number) {
  return `prog_results_${storageKey}_${index}`;
}

export function makeStorageKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

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

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}
