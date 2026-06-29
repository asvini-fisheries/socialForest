import type { ImportColumnSpec, MasterColumnFilter } from '@/lib/master-types';

export type { ImportColumnSpec };

export interface ImportRowError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export function filterMasterRows(
  rows: Record<string, unknown>[],
  query: string,
  searchKeys: string[],
  columnFilters?: MasterColumnFilter[],
  columnFilterValues?: Record<string, string>
): Record<string, unknown>[] {
  let result = rows;

  if (columnFilters?.length && columnFilterValues) {
    for (const filter of columnFilters) {
      const q = columnFilterValues[filter.id]?.trim().toLowerCase();
      if (!q) continue;
      result = result.filter((row) => filter.getValue(row).toLowerCase().includes(q));
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
