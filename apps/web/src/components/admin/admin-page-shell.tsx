'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

export function AdminSearchBar({
  onSearch,
  placeholder,
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  return (
    <form
      className="mb-5 portal-search-row"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query.trim());
      }}
    >
      <div className="portal-search-field">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? t('admin.searchPlaceholder')}
        />
      </div>
      <div className="portal-search-actions">
        <Button type="submit">{t('common.search')}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setQuery('');
            onSearch('');
          }}
        >
          {t('common.clear')}
        </Button>
      </div>
    </form>
  );
}

export function AdminPageBody({ children }: { children: React.ReactNode }) {
  return <div className="portal-page-body w-full">{children}</div>;
}

export function AdminFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={['portal-form-card apple-card h-fit w-full flex-none p-5 md:p-6', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
