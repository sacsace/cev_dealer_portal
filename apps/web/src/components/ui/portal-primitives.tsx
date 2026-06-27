'use client';

import { cn } from '@/lib/utils';

export function Alert({
  children,
  className,
  inline = false,
}: {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}) {
  return (
    <p className={cn('portal-alert portal-alert--error', inline && 'portal-alert--inline', className)}>
      {children}
    </p>
  );
}

export function IconButton({
  children,
  className,
  danger = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn('portal-icon-btn', danger && 'portal-icon-btn--danger', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function KpiCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="portal-kpi-card">
      <div className="portal-kpi-label">{label}</div>
      <div className="portal-kpi-value">{value}</div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  tabs: Array<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('portal-segmented', className)} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn('portal-segmented__btn', value === tab.key && 'portal-segmented__btn--active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
