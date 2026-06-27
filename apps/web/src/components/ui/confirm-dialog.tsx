'use client';

import { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const messageId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
      >
        <div className="px-6 pb-2 pt-6">
          <div
            className={cn(
              'mb-4 flex h-11 w-11 items-center justify-center rounded-full',
              variant === 'danger' ? 'portal-alert portal-alert--error' : 'bg-[rgba(140,198,63,0.12)] text-[var(--cev-green)]',
            )}
          >
            <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h2 id={titleId} className="text-base font-semibold text-[var(--text-primary)]">
            {title ?? t('common.deleteConfirmTitle')}
          </h2>
          <p id={messageId} className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <button type="button" onClick={onCancel} disabled={loading} className="apple-btn apple-btn-secondary">
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'apple-btn',
              variant === 'danger' ? 'apple-btn-danger' : 'apple-btn-primary',
            )}
          >
            {loading ? t('common.loading') : (confirmLabel ?? t('common.delete'))}
          </button>
        </div>
      </div>
    </div>
  );
}
