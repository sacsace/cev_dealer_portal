'use client';

import { useMemo, useState } from 'react';

export function useTableSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id));

  const selection = useMemo(
    () => ({
      selectedIds,
      allSelected,
      someSelected,
      onToggle: (id: string) => {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      },
      onToggleAll: () => {
        setSelectedIds((prev) => {
          if (items.length > 0 && items.every((item) => prev.has(item.id))) {
            return new Set();
          }
          return new Set(items.map((item) => item.id));
        });
      },
      clear: () => setSelectedIds(new Set()),
    }),
    [selectedIds, allSelected, someSelected, items],
  );

  return { selectedIds, setSelectedIds, selection };
}
