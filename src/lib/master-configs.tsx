'use client';

import {
  Users,
  Calendar,
  Handshake,
  Building2,
  Activity,
  Package,
  ClipboardList,
  FileText,
  Tags,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/types/database';
import type { MasterConfig } from '@/lib/master-types';

const USER_ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const USER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export const yearsConfig: MasterConfig = {
  title: 'Years',
  table: 'years',
  icon: Calendar,
  orderBy: 'start_date',
  softDelete: false,
  fields: [
    { name: 'year_label', label: 'Year Label', type: 'text', required: true, placeholder: '2025-26' },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: true },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'label', header: 'Year', render: (r) => String(r.year_label) },
    { key: 'start', header: 'Start', render: (r) => formatDate(String(r.start_date)) },
    { key: 'end', header: 'End', render: (r) => formatDate(String(r.end_date)) },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const designationsConfig: MasterConfig = {
  title: 'Designations',
  table: 'designations',
  icon: ClipboardList,
  orderBy: 'name',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'desc', header: 'Description', render: (r) => String(r.description || '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const certificatesConfig: MasterConfig = {
  title: 'Certificates',
  table: 'certificates',
  icon: FileText,
  orderBy: 'name',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'validity_period_months', label: 'Validity (months)', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'desc', header: 'Description', render: (r) => String(r.description || '—') },
    { key: 'validity', header: 'Validity (months)', render: (r) => String(r.validity_period_months ?? '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const csrPartnersConfig: MasterConfig = {
  title: 'CSR Partners',
  table: 'csr_partners',
  icon: Handshake,
  orderBy: 'name',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'contact_person', label: 'Contact Person', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'mobile', label: 'Mobile', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'state', label: 'State', type: 'text' },
    { name: 'pincode', label: 'Pincode', type: 'text' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    { key: 'contact', header: 'Contact', render: (r) => String(r.contact_person || '—') },
    { key: 'mobile', header: 'Mobile', render: (r) => String(r.mobile || '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const organisationsConfig: MasterConfig = {
  title: 'Organisations',
  table: 'organisations',
  icon: Building2,
  orderBy: 'name',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'state', label: 'State', type: 'text' },
    { name: 'pincode', label: 'Pincode', type: 'text' },
    { name: 'gstin', label: 'GSTIN', type: 'text' },
    { name: 'pan', label: 'PAN', type: 'text' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    { key: 'city', header: 'City', render: (r) => String(r.city || '—') },
    { key: 'gstin', header: 'GSTIN', render: (r) => String(r.gstin || '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const stakeholdersConfig: MasterConfig = {
  title: 'Stakeholders',
  table: 'stakeholders',
  icon: Users,
  orderBy: 'name',
  fields: [
    {
      name: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsFrom: { table: 'stakeholder_categories', valueKey: 'id', labelKey: 'name' },
    },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'contact_person', label: 'Contact Person', type: 'text' },
    { name: 'mobile', label: 'Mobile', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'gstin', label: 'GSTIN', type: 'text' },
    { name: 'pan', label: 'PAN', type: 'text' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    { key: 'contact', header: 'Contact', render: (r) => String(r.contact_person || '—') },
    { key: 'mobile', header: 'Mobile', render: (r) => String(r.mobile || '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const activitiesConfig: MasterConfig = {
  title: 'Activities',
  table: 'activities',
  icon: Activity,
  orderBy: 'name',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'unit_of_measurement', label: 'Unit', type: 'text', placeholder: 'acres, trees, kg' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    { key: 'unit', header: 'Unit', render: (r) => String(r.unit_of_measurement || '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const resourceCategoriesConfig: MasterConfig = {
  title: 'Resource Categories',
  table: 'resource_categories',
  icon: Tags,
  orderBy: 'name',
  fields: [
    { name: 'name', label: 'Category Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    {
      name: 'category_type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'material', label: 'Material' },
        { value: 'service', label: 'Service' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    {
      key: 'type',
      header: 'Type',
      render: (r) => (
        <span className="capitalize">{String(r.category_type)}</span>
      ),
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { category_type: 'material', is_active: true },
};

export const resourcesConfig: MasterConfig = {
  title: 'Resources / Materials',
  table: 'resources_materials',
  icon: Package,
  orderBy: 'name',
  selectQuery: '*, resource_category:resource_categories(name, category_type)',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'unit_of_measurement', label: 'Unit', type: 'text', required: true },
    {
      name: 'category_id',
      label: 'Resource Category',
      type: 'select',
      required: true,
      optionsFrom: {
        table: 'resource_categories',
        valueKey: 'id',
        labelKey: 'name',
        labelSuffixKey: 'category_type',
      },
    },
    { name: 'is_tree_species', label: 'Tree Species', type: 'boolean' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    { key: 'unit', header: 'Unit', render: (r) => String(r.unit_of_measurement) },
    {
      key: 'category',
      header: 'Category',
      render: (r) => {
        const cat = r.resource_category as { name?: string; category_type?: string } | null;
        return cat ? `${cat.name} (${cat.category_type})` : '—';
      },
    },
    { key: 'tree', header: 'Tree Species', render: (r) => (r.is_tree_species ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true, is_tree_species: false },
};

export const usersConfig: MasterConfig = {
  title: 'Users',
  table: 'users',
  icon: Users,
  orderBy: 'full_name',
  apiRoute: '/api/admin/users',
  softDelete: false,
  fields: [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'mobile', label: 'Mobile', type: 'text', required: true, placeholder: '10-digit number' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'role', label: 'Role', type: 'select', required: true, options: USER_ROLES },
    { name: 'status', label: 'Status', type: 'select', required: true, options: USER_STATUSES },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.full_name) },
    { key: 'mobile', header: 'Mobile', render: (r) => String(r.mobile) },
    { key: 'email', header: 'Email', render: (r) => String(r.email || '—') },
    { key: 'role', header: 'Role', render: (r) => ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] || String(r.role) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
  ],
  defaultValues: { role: 'organisation_employee', status: 'active' },
};
