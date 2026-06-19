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
  optionsFrom?: { table: string; valueKey: string; labelKey: string };
}

export interface MasterColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface MasterConfig {
  title: string;
  table: string;
  icon: LucideIcon;
  orderBy: string;
  fields: MasterField[];
  columns: MasterColumn<Record<string, unknown>>[];
  /** Use API route instead of direct Supabase for mutations */
  apiRoute?: string;
  /** Soft delete via is_active */
  softDelete?: boolean;
  defaultValues?: Record<string, unknown>;
}
