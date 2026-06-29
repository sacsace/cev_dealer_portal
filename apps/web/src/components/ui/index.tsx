'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getDealerOrderStage } from '@/lib/dealer-order-stage';
import { useI18n } from '@/components/providers/i18n-provider';
import { PasswordInput } from './password-input';

export function PageTitle({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-6', className)}>
      <h1 className="apple-headline">{title}</h1>
      {subtitle && <p className="apple-subhead mt-1.5">{subtitle}</p>}
    </div>
  );
}

export const Card = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
  }
>(function Card({ children, className, hover = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('apple-card p-5', hover && 'hover:-translate-y-0.5', className)}
      {...props}
    >
      {children}
    </div>
  );
});

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'default' | 'lg';
  }
>(function Button({ children, variant = 'primary', size = 'default', className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'apple-btn',
        variant === 'primary' && 'apple-btn-primary',
        (variant === 'secondary' || variant === 'outline') && 'apple-btn-secondary',
        variant === 'danger' && 'apple-btn-danger',
        size === 'lg' && 'apple-btn-lg',
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
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  error?: string;
}) {
  if (type === 'password') {
    return <PasswordInput label={label} required={required} error={error} {...props} />;
  }

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[var(--danger)]"> *</span>}
        </span>
      )}
      <input className="apple-input" type={type} {...props} />
      {error && <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span>}
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
          {required && <span className="text-[var(--danger)]"> *</span>}
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
          {required && <span className="text-[var(--danger)]"> *</span>}
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
  const hasIndexCol = columns[0] === '#';

  return (
    <div className="portal-data-table w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="portal-data-table__scroll w-full overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-full table-fixed text-sm">
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
                    className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--cev-green)]"
                  />
                </th>
              )}
              {columns.map((col, colIndex) => (
                <th
                  key={col}
                  className={cn(
                    'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]',
                    hasIndexCol && colIndex === 0 && 'w-12',
                  )}
                >
                  {col}
                </th>
              ))}
              {actions && (
                <th className="w-28 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
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
                      isSelected && 'bg-[rgba(140,198,63,0.06)]',
                    )}
                  >
                    {selection && rowId && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selection.selectedIds.has(rowId)}
                          onChange={() => selection.onToggle(rowId)}
                          aria-label={t('admin.selectRow')}
                          className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--cev-green)]"
                        />
                      </td>
                    )}
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={cn(
                          'px-4 py-3 text-[13px] text-[var(--text-primary)]',
                          hasIndexCol && j === 0 && 'w-12',
                        )}
                      >
                        {typeof cell === 'string' || typeof cell === 'number' ? (
                          <span className="block truncate">{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className="w-28 px-4 py-3" onClick={(e) => e.stopPropagation()}>
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

  const tones: Record<string, string> = {
    CREATED: 'status-badge--neutral',
    SUBMITTED: 'status-badge--info',
    APPROVED: 'status-badge--success',
    REJECTED: 'status-badge--danger',
    DRAFT: 'status-badge--warning',
    ORDER_SHIPPED: 'status-badge--purple',
    DELIVERED: 'status-badge--success',
    ACTIVE: 'status-badge--success',
    INACTIVE: 'status-badge--neutral',
  };

  return (
    <span className={cn('status-badge', tones[status] ?? 'status-badge--neutral')}>
      {label}
    </span>
  );
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const key = status.replace(/\s+/g, '_').toUpperCase();
  const label =
    t(`deliveryStatus.${key}`) !== `deliveryStatus.${key}`
      ? t(`deliveryStatus.${key}`)
      : status.replace(/_/g, ' ');

  const tones: Record<string, string> = {
    PREPARING: 'status-badge--warning',
    IN_TRANSIT: 'status-badge--purple',
    DELIVERED: 'status-badge--success',
  };

  return (
    <span className={cn('status-badge', tones[key] ?? 'status-badge--neutral')}>
      {label}
    </span>
  );
}

export function DealerOrderStageBadge({
  orderStatus,
  deliveryStatus,
}: {
  orderStatus: string;
  deliveryStatus?: string | null;
}) {
  const { t } = useI18n();
  const stage = getDealerOrderStage(orderStatus, deliveryStatus);

  const labels: Record<string, string> = {
    CONFIRMATION: t('orders.stageConfirmation'),
    PREPARING: t('orders.stagePreparing'),
    COMPLETED: t('orders.stageCompleted'),
  };

  const tones: Record<string, string> = {
    CONFIRMATION: 'status-badge--info',
    PREPARING: 'status-badge--purple',
    COMPLETED: 'status-badge--success',
  };

  return (
    <span className={cn('status-badge status-badge--stage', tones[stage] ?? 'status-badge--neutral')}>
      {labels[stage]}
    </span>
  );
}

export { Alert, IconButton, KpiCard, SegmentedControl } from './portal-primitives';

export { LanguageSwitcher } from './language-switcher';
export { ConfirmDialog } from './confirm-dialog';
export { useConfirmDialog } from './use-confirm-dialog';
export { AlertDialog } from './alert-dialog';
export { useAlertDialog } from './use-alert-dialog';
export { PortalSearchBar } from './portal-search-bar';
export { PortalStatusTabs } from './portal-status-tabs';
export type { StatusTab } from './portal-status-tabs';
