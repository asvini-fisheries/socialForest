import type { ImportColumnSpec } from './master-types';

export interface MasterTableSpec {
  title: string;
  table: string;
  orderBy: string;
  selectQuery?: string;
  importEnabled: boolean;
  searchKeys: string[];
  importColumns: ImportColumnSpec[];
}

export const MASTER_TABLE_SPECS: Record<string, MasterTableSpec> = {
  years: {
    title: 'Years',
    table: 'years',
    orderBy: 'start_date',
    importEnabled: true,
    searchKeys: ['year_label'],
    importColumns: [
      { key: 'year_label', header: 'Year Label', type: 'text', required: true },
      { key: 'start_date', header: 'Start Date', type: 'date', required: true },
      { key: 'end_date', header: 'End Date', type: 'date', required: true },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  designations: {
    title: 'Designations',
    table: 'designations',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'description'],
    importColumns: [
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'description', header: 'Description', type: 'textarea' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  certificates: {
    title: 'Certificates',
    table: 'certificates',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'description'],
    importColumns: [
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'description', header: 'Description', type: 'textarea' },
      { key: 'validity_period_months', header: 'Validity (months)', type: 'number' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  csr_partners: {
    title: 'CSR Partners',
    table: 'csr_partners',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'code', 'contact_person', 'email', 'mobile', 'city'],
    importColumns: [
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'code', header: 'Code', type: 'text' },
      { key: 'contact_person', header: 'Contact Person', type: 'text' },
      { key: 'email', header: 'Email', type: 'email' },
      { key: 'mobile', header: 'Mobile', type: 'text' },
      { key: 'address', header: 'Address', type: 'textarea' },
      { key: 'city', header: 'City', type: 'text' },
      { key: 'state', header: 'State', type: 'text' },
      { key: 'pincode', header: 'Pincode', type: 'text' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  organisations: {
    title: 'Organisations',
    table: 'organisations',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'code', 'city', 'gstin', 'pan'],
    importColumns: [
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'code', header: 'Code', type: 'text' },
      { key: 'address', header: 'Address', type: 'textarea' },
      { key: 'city', header: 'City', type: 'text' },
      { key: 'state', header: 'State', type: 'text' },
      { key: 'pincode', header: 'Pincode', type: 'text' },
      { key: 'gstin', header: 'GSTIN', type: 'text' },
      { key: 'pan', header: 'PAN', type: 'text' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  stakeholders: {
    title: 'Stakeholders',
    table: 'stakeholders',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'code', 'contact_person', 'mobile', 'email'],
    importColumns: [
      {
        key: 'category_id',
        header: 'Category',
        type: 'select',
        required: true,
        resolveFrom: { table: 'stakeholder_categories', valueKey: 'id', labelKey: 'name' },
      },
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'code', header: 'Code', type: 'text' },
      { key: 'contact_person', header: 'Contact Person', type: 'text' },
      { key: 'mobile', header: 'Mobile', type: 'text' },
      { key: 'email', header: 'Email', type: 'email' },
      { key: 'gstin', header: 'GSTIN', type: 'text' },
      { key: 'pan', header: 'PAN', type: 'text' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  activities: {
    title: 'Activities',
    table: 'activities',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'code', 'description'],
    importColumns: [
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'code', header: 'Code', type: 'text' },
      { key: 'description', header: 'Description', type: 'textarea' },
      { key: 'unit_of_measurement', header: 'Unit', type: 'text' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  resource_categories: {
    title: 'Resource Categories',
    table: 'resource_categories',
    orderBy: 'name',
    importEnabled: true,
    searchKeys: ['name', 'code', 'description'],
    importColumns: [
      { key: 'name', header: 'Category Name', type: 'text', required: true },
      { key: 'code', header: 'Code', type: 'text' },
      {
        key: 'category_type',
        header: 'Type',
        type: 'select',
        required: true,
        options: [
          { value: 'material', label: 'Material' },
          { value: 'service', label: 'Service' },
        ],
      },
      { key: 'description', header: 'Description', type: 'textarea' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  resources_materials: {
    title: 'Resources',
    table: 'resources_materials',
    orderBy: 'name',
    selectQuery: '*, resource_category:resource_categories(name, category_type)',
    importEnabled: true,
    searchKeys: ['name', 'code', 'description', 'unit_of_measurement'],
    importColumns: [
      { key: 'name', header: 'Name', type: 'text', required: true },
      { key: 'code', header: 'Code', type: 'text' },
      { key: 'description', header: 'Description', type: 'textarea' },
      { key: 'unit_of_measurement', header: 'Unit', type: 'text', required: true },
      {
        key: 'category_id',
        header: 'Resource Category',
        type: 'select',
        required: true,
        resolveFrom: {
          table: 'resource_categories',
          valueKey: 'id',
          labelKey: 'name',
          labelSuffixKey: 'category_type',
        },
      },
      { key: 'is_tree_species', header: 'Tree Species', type: 'boolean' },
      { key: 'is_active', header: 'Active', type: 'boolean' },
    ],
  },
  users: {
    title: 'Users',
    table: 'users',
    orderBy: 'full_name',
    importEnabled: false,
    searchKeys: ['full_name', 'mobile', 'email'],
    importColumns: [
      { key: 'full_name', header: 'Full Name', type: 'text', required: true },
      { key: 'mobile', header: 'Mobile', type: 'text', required: true },
      { key: 'email', header: 'Email', type: 'email' },
      {
        key: 'role',
        header: 'Role',
        type: 'select',
        required: true,
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'organisation_admin', label: 'Organisation Admin' },
          { value: 'organisation_employee', label: 'Organisation Employee' },
          { value: 'stakeholder', label: 'Stakeholder' },
        ],
      },
      {
        key: 'status',
        header: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'suspended', label: 'Suspended' },
        ],
      },
    ],
  },
};

export function getMasterTableSpec(table: string): MasterTableSpec | null {
  return MASTER_TABLE_SPECS[table] ?? null;
}
