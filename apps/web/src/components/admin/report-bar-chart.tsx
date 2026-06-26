'use client';

import { cn } from '@/lib/utils';

export function ReportBarChart({
  rows,
  valueKey = 'count',
  className,
}: {
  rows: Array<{ label: string; count: number; amount?: number }>;
  valueKey?: 'count' | 'amount';
  className?: string;
}) {
  const max = Math.max(...rows.map((row) => (valueKey === 'amount' ? row.amount ?? 0 : row.count)), 1);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {rows.map((row) => {
        const value = valueKey === 'amount' ? row.amount ?? 0 : row.count;
        const width = Math.max(4, Math.round((value / max) * 100));

        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
              <span className="truncate text-[var(--text-primary)]">{row.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--text-secondary)]">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--cev-blue)] transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
