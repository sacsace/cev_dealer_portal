'use client';

import { cn } from '@/lib/utils';

export function DashboardTrendChart({
  points,
  className,
}: {
  points: Array<{ label: string; count: number }>;
  className?: string;
}) {
  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <div className={cn('admin-dashboard-trend', className)}>
      {points.map((point) => {
        const height = Math.max(10, Math.round((point.count / max) * 100));

        return (
          <div key={point.label} className="admin-dashboard-trend__col">
            <span className="admin-dashboard-trend__value">{point.count}</span>
            <div className="admin-dashboard-trend__bar-wrap">
              <div className="admin-dashboard-trend__bar" style={{ height: `${height}%` }} />
            </div>
            <span className="admin-dashboard-trend__label">{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}
