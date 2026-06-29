import type { SupabaseClient } from '@supabase/supabase-js';
import type { ImportColumnSpec, CompositeLookupSpec } from '@/lib/master-types';
import type { MasterTableSpec } from '@/lib/master-registry-data';
import { parseBoolean } from '@/lib/parse-boolean';

export interface ImportRowError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportRowError[];
}

const lookupCache = new Map<string, Map<string, string>>();

/** Trim + lowercase so Excel values match DB labels with stray spaces. */
function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

async function getLookupMap(
  service: SupabaseClient,
  spec: NonNullable<ImportColumnSpec['resolveFrom']>
): Promise<Map<string, string>> {
  const cacheKey = `${spec.table}:${spec.labelKey}`;
  if (lookupCache.has(cacheKey)) return lookupCache.get(cacheKey)!;

  const { data } = await service.from(spec.table).select('*');
  const map = new Map<string, string>();
  for (const row of data || []) {
    const r = row as Record<string, string>;
    const rawLabel = spec.labelSuffixKey
      ? `${r[spec.labelKey]} (${r[spec.labelSuffixKey]})`
      : String(r[spec.labelKey] ?? '');
    map.set(normalizeLookupKey(rawLabel), r[spec.valueKey]);
    map.set(normalizeLookupKey(String(r[spec.labelKey] ?? '')), r[spec.valueKey]);
    if (spec.labelSuffixKey && r[spec.labelSuffixKey]) {
      map.set(normalizeLookupKey(String(r[spec.labelSuffixKey])), r[spec.valueKey]);
    }
  }
  lookupCache.set(cacheKey, map);
  return map;
}

function mapHeaderToKey(
  row: Record<string, string>,
  columns: ImportColumnSpec[]
): Record<string, string> {
  const headerMap = Object.fromEntries(columns.map((c) => [c.header.toLowerCase(), c.key]));
  const mapped: Record<string, string> = {};
  for (const [header, value] of Object.entries(row)) {
    const key = headerMap[header.trim().toLowerCase()] ?? header;
    mapped[key] = String(value ?? '').trim();
  }
  return mapped;
}

function isEmptyRow(values: Record<string, string>): boolean {
  return Object.values(values).every((v) => !v.trim());
}

async function resolveCompositeLookups(
  service: SupabaseClient,
  payload: Record<string, unknown>,
  composites: CompositeLookupSpec[],
  excelRow: number,
  errors: ImportRowError[]
): Promise<boolean> {
  for (const composite of composites) {
    const filters: Record<string, string> = {};

    for (const part of composite.matchFields) {
      const val = payload[part.importKey];
      if (!val) {
        errors.push({
          row: excelRow,
          column: part.importKey,
          value: '',
          message: 'Required for composite lookup',
        });
        return false;
      }
      filters[part.rowField] = String(val);
    }

    let query = service.from(composite.table).select('id');
    for (const [field, value] of Object.entries(filters)) {
      query = query.eq(field, value);
    }
    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      errors.push({
        row: excelRow,
        column: composite.targetKey,
        value: '',
        message: error?.message || `No ${composite.table} row matches the given values`,
      });
      return false;
    }
    payload[composite.targetKey] = (data as { id: string }).id;
  }

  return true;
}

export async function importMasterRows(
  service: SupabaseClient,
  spec: MasterTableSpec,
  rawRows: Record<string, string>[]
): Promise<ImportResult> {
  lookupCache.clear();
  const errors: ImportRowError[] = [];
  let successCount = 0;
  const dataRows = rawRows.filter((r) => !isEmptyRow(mapHeaderToKey(r, spec.importColumns)));

  for (let i = 0; i < dataRows.length; i++) {
    const excelRow = i + 2;
    const mapped = mapHeaderToKey(dataRows[i], spec.importColumns);
    const payload: Record<string, unknown> = {};
    let rowValid = true;

    for (const col of spec.importColumns) {
      const raw = mapped[col.key] ?? '';

      if (!raw && col.required) {
        errors.push({
          row: excelRow,
          column: col.header,
          value: raw,
          message: `${col.header} is required`,
        });
        rowValid = false;
        break;
      }

      if (!raw) {
        if (col.type === 'boolean') payload[col.key] = true;
        continue;
      }

      if (col.type === 'boolean') {
        payload[col.key] = parseBoolean(raw);
      } else if (col.type === 'number') {
        const num = Number(raw);
        if (Number.isNaN(num)) {
          errors.push({
            row: excelRow,
            column: col.header,
            value: raw,
            message: 'Must be a number',
          });
          rowValid = false;
          break;
        }
        payload[col.key] = num;
      } else if (col.resolveFrom) {
        const lookup = await getLookupMap(service, col.resolveFrom);
        const id = lookup.get(normalizeLookupKey(raw));
        if (!id) {
          errors.push({
            row: excelRow,
            column: col.header,
            value: raw,
            message: `No match found in ${col.resolveFrom.table}`,
          });
          rowValid = false;
          break;
        }
        payload[col.key] = id;
      } else if (col.options?.length) {
        const match = col.options.find(
          (o) =>
            o.label.toLowerCase() === raw.toLowerCase() || o.value.toLowerCase() === raw.toLowerCase()
        );
        if (!match) {
          errors.push({
            row: excelRow,
            column: col.header,
            value: raw,
            message: `Invalid value. Allowed: ${col.options.map((o) => o.label).join(', ')}`,
          });
          rowValid = false;
          break;
        }
        payload[col.key] = match.value;
      } else {
        payload[col.key] = raw;
      }

      if (col.importOnly) {
        continue;
      }
    }

    if (!rowValid) continue;

    if (spec.compositeLookups?.length) {
      const ok = await resolveCompositeLookups(
        service,
        payload,
        spec.compositeLookups,
        excelRow,
        errors
      );
      if (!ok) continue;
      for (const col of spec.importColumns) {
        if (col.importOnly) delete payload[col.key];
      }
    }

    const { error } = await service.from(spec.table).insert(payload);
    if (error) {
      errors.push({
        row: excelRow,
        column: '—',
        value: '',
        message: error.message,
      });
    } else {
      successCount++;
    }
  }

  return {
    totalRows: dataRows.length,
    successCount,
    errorCount: dataRows.length - successCount,
    errors,
  };
}
