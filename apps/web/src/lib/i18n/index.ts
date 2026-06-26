import { ko } from './ko';
import { en } from './en';
import type { Locale } from './types';

export const DEFAULT_LOCALE: Locale = 'en';

export const dictionaries = { ko, en } as const;

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function translate(locale: Locale, key: string): string {
  return getNestedValue(dictionaries[locale] as unknown as Record<string, unknown>, key);
}

export type { Locale };
