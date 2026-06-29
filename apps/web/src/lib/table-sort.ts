export type SortDirection = 'asc' | 'desc';

export function compareValues(a: string | number, b: string | number, direction: SortDirection) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (a < b) return direction === 'asc' ? -1 : 1;
    if (a > b) return direction === 'asc' ? 1 : -1;
    return 0;
  }

  const av = String(a).toLowerCase();
  const bv = String(b).toLowerCase();
  if (av < bv) return direction === 'asc' ? -1 : 1;
  if (av > bv) return direction === 'asc' ? 1 : -1;
  return 0;
}

export function sortByKey<T>(
  items: T[],
  key: string,
  direction: SortDirection,
  accessors: Record<string, (item: T) => string | number>,
): T[] {
  const accessor = accessors[key];
  if (!accessor) return items;
  return [...items].sort((a, b) => compareValues(accessor(a), accessor(b), direction));
}

export function nextSortState(
  currentKey: string,
  currentDirection: SortDirection,
  clickedKey: string,
): { key: string; direction: SortDirection } {
  if (currentKey === clickedKey) {
    return { key: clickedKey, direction: currentDirection === 'asc' ? 'desc' : 'asc' };
  }
  return { key: clickedKey, direction: 'asc' };
}
