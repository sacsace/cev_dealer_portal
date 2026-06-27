'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertDialog, type AlertDialogProps } from './alert-dialog';

export type AlertOptions = Pick<AlertDialogProps, 'title' | 'message' | 'confirmLabel' | 'variant'>;

export function useAlertDialog() {
  const [state, setState] = useState<(AlertOptions & { open: true }) | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, ...options });
    });
  }, []);

  const close = useCallback(() => {
    setState(null);
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  const alertDialog = state ? (
    <AlertDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      variant={state.variant}
      onClose={close}
    />
  ) : null;

  return { alert, alertDialog };
}
