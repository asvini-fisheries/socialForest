import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type FieldType = 'text' | 'email' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';

export interface MasterField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Load options dynamically from another table */
  optionsFrom?: {
    table: string;
    valueKey: string;
    labelKey: string;
    labelSuffixKey?: string;
    selectQuery?: string;
    formatLabel?: (row: Record<string, unknown>) => string;
  };
  /** Coerce value to number on save (e.g. numeric select) */
  coerceNumber?: boolean;
}

export interface MasterColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

/** Per-column filter shown above the grid */
export type MasterColumnFilterMode = 'text' | 'multiselect';

export interface MasterColumnFilter {
  id: string;
  label: string;
  placeholder?: string;
  mode?: MasterColumnFilterMode;
  getValue: (row: Record<string, unknown>) => string;
  /** Stable match key for multiselect (defaults to getValue) */
  getKey?: (row: Record<string, unknown>) => string;
}

export interface ImportColumnSpec {
  key: string;
  header: string;
  required?: boolean;
  type: FieldType;
  resolveFrom?: {
    table: string;
    valueKey: string;
    labelKey: string;
    labelSuffixKey?: string;
  };
  options?: { value: string; label: string }[];
  /** Resolved for import only; not inserted into row payload */
  importOnly?: boolean;
}

export interface CompositeLookupSpec {
  targetKey: string;
  table: string;
  matchFields: Array<{
    importKey: string;
    rowField: string;
    resolveFrom: {
      table: string;
      valueKey: string;
      labelKey: string;
      labelSuffixKey?: string;
    };
  }>;
}

export interface MasterConfig {
  title: string;
  table: string;
  icon: LucideIcon;
  orderBy: string;
  fields: MasterField[];
  columns: MasterColumn<Record<string, unknown>>[];
  selectQuery?: string;
  /** Use API route instead of direct Supabase for mutations */
  apiRoute?: string;
  /** Soft delete via is_active */
  softDelete?: boolean;
  defaultValues?: Record<string, unknown>;
  /** Fields used for client-side search (defaults to text fields) */
  searchKeys?: string[];
  /** Optional per-column filters (e.g. Project, Parent, Code) */
  columnFilters?: MasterColumnFilter[];
  /** DB column for image (default: image_url, logo_url, or avatar_url per table) */
  imageField?: string;
  /** Show image upload in CRUD dialog and image column in grid (default: true for known master tables) */
  imageAttachments?: boolean;
}
