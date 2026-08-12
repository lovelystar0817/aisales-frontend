import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StorageItemWithExpiry {
  value: string;
  expiresAt: number;
}

export function setLocalStorageWithExpiry(
  key: string,
  value: string,
  expiryMinutes: number,
): void {
  if (typeof window === 'undefined') return;

  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  const item: StorageItemWithExpiry = {
    value,
    expiresAt,
  };

  localStorage.setItem(key, JSON.stringify(item));
}

export function getLocalStorageWithExpiry(key: string): string | null {
  if (typeof window === 'undefined') return null;

  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item: StorageItemWithExpiry = JSON.parse(itemStr);

    if (Date.now() > item.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
