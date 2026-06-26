'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const options: { value: Locale; label: string }[] = [
    { value: 'en', label: t('lang.en') },
    { value: 'ko', label: t('lang.ko') },
  ];

  return (
    <div
      className={cn(
        'inline-flex rounded-full bg-black/[0.04] p-0.5 backdrop-blur-sm',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            locale === opt.value
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
