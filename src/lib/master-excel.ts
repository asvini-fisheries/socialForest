import 'server-only';

import * as XLSX from 'xlsx';
import type { ImportColumnSpec } from './master-types';
import { parseBoolean } from './parse-boolean';

export { parseBoolean };

export interface ImportRowError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export function sheetToRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
}

export function rowsToWorkbook(
  sheetName: string,
  headers: string[],
  dataRows: (string | number | boolean | null)[][]
): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return out;
}

export function buildTemplateBuffer(title: string, columns: ImportColumnSpec[]): ArrayBuffer {
  const headers = columns.map((c) => c.header);
  const sample = columns.map((c) => {
    if (c.type === 'boolean') return 'Yes';
    if (c.type === 'number') return '0';
    if (c.options?.length) return c.options[0].label;
    if (c.resolveFrom) return `Sample ${c.header}`;
    return '';
  });
  return rowsToWorkbook(`${title} Template`, headers, [sample]);
}

export function exportRowsBuffer(
  title: string,
  columns: ImportColumnSpec[],
  rows: Record<string, unknown>[]
): ArrayBuffer {
  const headers = columns.map((c) => c.header);
  const data = rows.map((row) =>
    columns.map((col) => formatExportCell(row[col.key], col.type))
  );
  return rowsToWorkbook(title, headers, data);
}

function formatExportCell(value: unknown, type: ImportColumnSpec['type']): string | number {
  if (value == null || value === '') return '';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.name) return String(obj.name);
    return JSON.stringify(value);
  }
  return String(value);
}
