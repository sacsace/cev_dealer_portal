'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="apple-headline">{title}</h1>
      {subtitle && <p className="apple-subhead mt-1.5">{subtitle}</p>}
    </div>
  );
}

export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn('apple-card p-5', hover && 'hover:-translate-y-0.5', className)}>
      {children}
    </div>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  }
>(function Button({ children, variant = 'primary', className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'text-sm font-medium transition-all disabled:opacity-45',
        variant === 'primary' && 'apple-btn-primary',
        variant === 'secondary' && 'apple-btn-secondary',
        variant === 'outline' && 'apple-btn-secondary',
        variant === 'danger' &&
          'inline-flex items-center justify-center rounded-full bg-[#ff3b30] px-5 py-2.5 text-white hover:bg-[#ff453a]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export function Input({
  label,
  required,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[#ff3b30]"> *</span>}
        </span>
      )}
      <input className="apple-input" {...props} />
      {error && <span className="mt-1 block text-xs text-[#ff3b30]">{error}</span>}
    </label>
  );
}

export function Textarea({
  label,
  required,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[#ff3b30]"> *</span>}
        </span>
      )}
      <textarea className={cn('apple-input resize-y', className)} rows={3} {...props} />
    </label>
  );
}

export function Select({
  label,
  required,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[#ff3b30]"> *</span>}
        </span>
      )}
      <select className="apple-input" {...props}>
        {children}
      </select>
    </label>
  );
}

export function DataTable({
  columns,
  rows,
  actions,
  emptyMessage,
  rowIds,
  onRowClick,
  selection,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  actions?: (index: number) => React.ReactNode;
  emptyMessage?: string;
  rowIds?: string[];
  onRowClick?: (index: number) => void;
  selection?: {
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    allSelected: boolean;
    someSelected: boolean;
  };
}) {
  const { t } = useI18n();
  const empty = emptyMessage ?? t('common.noRecords');
  const extraCols = (actions ? 1 : 0) + (selection ? 1 : 0);

  return (
    <div className="portal-data-table rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              {selection && (
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selection.allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selection.someSelected && !selection.allSelected;
                    }}
                    onChange={selection.onToggleAll}
                    aria-label={t('admin.selectAll')}
                    className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--cev-blue)]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                >
                  {col}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {t('common.action')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + extraCols}
                  className="px-4 py-12 text-center text-[13px] text-[var(--text-tertiary)]"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const rowId = rowIds?.[i];
                const isSelected = rowId ? selection?.selectedIds.has(rowId) : false;

                return (
                  <tr
                    key={rowId ?? i}
                    onClick={() => onRowClick?.(i)}
                    className={cn(
                      'border-b border-[var(--border)] last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-[var(--bg-secondary)]/70',
                      isSelected && 'bg-[rgba(0,174,239,0.06)]',
                    )}
                  >
                    {selection && rowId && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selection.selectedIds.has(rowId)}
                          onChange={() => selection.onToggle(rowId)}
                          aria-label={t('admin.selectRow')}
                          className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--cev-blue)]"
                        />
                      </td>
                    )}
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-[13px] text-[var(--text-primary)]">
                        {cell}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {actions(i)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const label = t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status.replace(/_/g, ' ');

  const colors: Record<string, string> = {
    CREATED: 'bg-[#f5f5f7] text-[#6e6e73]',
    SUBMITTED: 'bg-[#e8f2ff] text-[#0071e3]',
    APPROVED: 'bg-[#e8faf0] text-[#248a3d]',
    REJECTED: 'bg-[#fff0ef] text-[#ff3b30]',
    DRAFT: 'bg-[#fff8e6] text-[#b25000]',
    ORDER_SHIPPED: 'bg-[#f3e8ff] text-[#8944ab]',
    DELIVERED: 'bg-[#e8faf0] text-[#248a3d]',
    ACTIVE: 'bg-[#e8faf0] text-[#248a3d]',
    INACTIVE: 'bg-[#f5f5f7] text-[#6e6e73]',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors[status] ?? 'bg-[#f5f5f7] text-[#6e6e73]',
      )}
    >
      {label}
    </span>
  );
}

export { LanguageSwitcher } from './language-switcher';
export { ConfirmDialog } from './confirm-dialog';
export { useConfirmDialog } from './use-confirm-dialog';
export { PortalSearchBar } from './portal-search-bar';
