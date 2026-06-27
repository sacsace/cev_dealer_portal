'use client';

import { useEffect, useId, useRef } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export type AlertDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: 'success' | 'info';
  onClose: () => void;
};

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = 'success',
  onClose,
}: AlertDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const messageId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const Icon = variant === 'success' ? CheckCircle2 : Info;

  return (
    <div className="portal-dialog-root">
      <div className="portal-dialog-backdrop" onClick={onClose} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={messageId}
        className="portal-dialog-panel"
      >
        <div className="portal-dialog-body">
          <div
            className={cn(
              'portal-dialog-icon',
              variant === 'success' ? 'portal-dialog-icon--success' : 'portal-dialog-icon--info',
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          {title ? (
            <h2 id={titleId} className="portal-dialog-title">
              {title}
            </h2>
          ) : null}
          <p id={messageId} className={cn('portal-dialog-message', !title && 'mt-0')}>
            {message}
          </p>
        </div>

        <div className="portal-dialog-footer portal-dialog-footer--single">
          <button ref={confirmRef} type="button" onClick={onClose} className="apple-btn apple-btn-primary">
            {confirmLabel ?? t('common.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
