'use client';

import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export function ImagePreviewDialog({
  src,
  alt,
  fileName,
  imageClassName,
  triggerClassName,
}: {
  src: string;
  alt: string;
  fileName?: string;
  imageClassName?: string;
  triggerClassName?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('block w-full cursor-zoom-in text-left', triggerClassName)}
        aria-label={`${t('common.view')} ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={imageClassName} />
      </button>

      {open ? (
        <div className="portal-dialog-root z-[90]">
          <div
            className="portal-dialog-backdrop bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={fileName ? titleId : undefined}
            aria-label={fileName ? undefined : alt}
            className="relative z-[1] flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              {fileName ? (
                <p id={titleId} className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                  {fileName}
                </p>
              ) : (
                <span className="sr-only">{alt}</span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-black/[0.05] hover:text-[var(--text-primary)]"
                aria-label={t('common.closeMenu')}
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex min-h-[12rem] flex-1 items-center justify-center overflow-auto bg-[var(--bg-secondary)] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="max-h-[calc(100vh-8rem)] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
