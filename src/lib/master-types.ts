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
  };
  /** Coerce value to number on save (e.g. numeric select) */
  coerceNumber?: boolean;
}

export interface MasterColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
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
  /** DB column for image (default: image_url, logo_url, or avatar_url per table) */
  imageField?: string;
}
