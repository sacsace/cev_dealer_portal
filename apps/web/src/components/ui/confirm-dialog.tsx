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
    <div className="portal-dialog-root">
      <div
        className="portal-dialog-backdrop"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="portal-dialog-panel"
      >
        <div className="portal-dialog-body">
          <div
            className={cn(
              'portal-dialog-icon',
              variant === 'danger' ? 'portal-dialog-icon--danger' : 'portal-dialog-icon--success',
            )}
          >
            <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h2 id={titleId} className="portal-dialog-title">
            {title ?? t('common.deleteConfirmTitle')}
          </h2>
          <p id={messageId} className="portal-dialog-message">
            {message}
          </p>
        </div>

        <div className="portal-dialog-footer">
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
