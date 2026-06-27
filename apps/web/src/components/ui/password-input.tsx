'use client';

import { forwardRef, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label?: string;
  required?: boolean;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, required, error, className, value = '', onChange, disabled, onKeyDown, onPaste, ...props },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null);
  const stringValue =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';

  const emitChange = useCallback(
    (next: string) => {
      if (!onChange) return;
      const event = {
        target: { value: next },
        currentTarget: { value: next },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled || props.readOnly) return;

    if (
      e.key === 'Tab' ||
      e.key.startsWith('Arrow') ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'Shift' ||
      e.key === 'Control' ||
      e.key === 'Alt' ||
      e.key === 'Meta' ||
      e.key === 'CapsLock'
    ) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      emitChange('');
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      emitChange(stringValue.slice(0, -1));
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      emitChange('');
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      emitChange(stringValue + e.key);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(e);
    if (e.defaultPrevented || disabled || props.readOnly) return;

    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (text) emitChange(stringValue + text);
  };

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[var(--danger)]"> *</span>}
        </span>
      )}
      <input
        ref={mergeRefs(ref, innerRef)}
        type="text"
        className={cn('apple-input password-input-asterisk', className)}
        value={'*'.repeat(stringValue.length)}
        disabled={disabled}
        onChange={() => undefined}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        autoComplete={props.autoComplete ?? 'off'}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
});
