'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

type PortalSearchBarProps = {
  placeholder?: string;
  paramKey?: string;
  debounceMs?: number;
  preserveParams?: string[];
  className?: string;
};

export function PortalSearchBar({
  placeholder,
  paramKey = 'search',
  debounceMs = 350,
  preserveParams = ['status'],
  className,
}: PortalSearchBarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get(paramKey) ?? '';
  const [query, setQuery] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushQuery(next: string) {
    const params = new URLSearchParams();
    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    const trimmed = next.trim();
    if (trimmed) params.set(paramKey, trimmed);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushQuery(query);
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushQuery(value);
    }, debounceMs);
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    pushQuery('');
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? 'portal-search-row'}>
      <div className="portal-search-field">
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder ?? t('admin.searchPlaceholder')}
          className="apple-input w-full"
          aria-label={placeholder ?? t('common.search')}
        />
      </div>
      <div className="portal-search-actions">
        <Button type="submit">{t('common.search')}</Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          {t('common.clear')}
        </Button>
      </div>
    </form>
  );
}
