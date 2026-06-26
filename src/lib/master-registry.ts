import type { ImportColumnSpec } from '@/lib/master-types';

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
  searchKeys: string[]
): Record<string, unknown>[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    searchKeys.some((key) => {
      const val = row[key];
      if (val == null) return false;
      if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(q);
      return String(val).toLowerCase().includes(q);
    })
  );
}
