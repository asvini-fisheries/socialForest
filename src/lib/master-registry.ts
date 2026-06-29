import type { ImportColumnSpec, MasterColumnFilter } from '@/lib/master-types';

export type { ImportColumnSpec };

export interface ImportRowError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export type ColumnFilterValues = Record<string, string | string[]>;

export function filterMasterRows(
  rows: Record<string, unknown>[],
  query: string,
  searchKeys: string[],
  columnFilters?: MasterColumnFilter[],
  columnFilterValues?: ColumnFilterValues
): Record<string, unknown>[] {
  let result = rows;

  if (columnFilters?.length && columnFilterValues) {
    for (const filter of columnFilters) {
      const raw = columnFilterValues[filter.id];
      if (filter.mode === 'multiselect') {
        const selected = Array.isArray(raw) ? raw : [];
        if (selected.length === 0) continue;
        result = result.filter((row) => {
          const key = filter.getKey?.(row) ?? filter.getValue(row);
          return selected.includes(key);
        });
      } else {
        const q = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
        if (!q) continue;
        result = result.filter((row) => filter.getValue(row).toLowerCase().includes(q));
      }
    }
  }

  const q = query.trim().toLowerCase();
  if (!q) return result;

  return result.filter((row) =>
    searchKeys.some((key) => {
      const val = row[key];
      if (val == null) return false;
      if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(q);
      return String(val).toLowerCase().includes(q);
    })
  );
}

export function hasActiveColumnFilters(
  columnFilters: MasterColumnFilter[] | undefined,
  columnFilterValues: ColumnFilterValues
): boolean {
  if (!columnFilters?.length) return false;
  return columnFilters.some((filter) => {
    const raw = columnFilterValues[filter.id];
    if (filter.mode === 'multiselect') return Array.isArray(raw) && raw.length > 0;
    return typeof raw === 'string' && raw.trim().length > 0;
  });
}
