'use client';

import {
  Tags,
  Link2,
  IndianRupee,
  Shield,
  UserCircle,
  Award,
  IdCard,
  Package,
  HardHat,
  FileSignature,
  ListOrdered,
} from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import type { MasterConfig } from '@/lib/master-types';

const PROJECT_ACTIVITY_OPTIONS = {
  table: 'project_activities',
  valueKey: 'id',
  labelKey: 'id',
  selectQuery:
    'id, project:projects(name, code), activity:activities(name, code), project_area:project_areas(name, code)',
  formatLabel: (row: Record<string, unknown>) => {
    const project = row.project as { name?: string } | null;
    const activity = row.activity as { name?: string } | null;
    const area = row.project_area as { name?: string } | null;
    const base = `${project?.name || '?'} — ${activity?.name || '?'}`;
    return area?.name ? `${base} (${area.name})` : base;
  },
};

const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

const MODULE_NAME_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'projects', label: 'Projects' },
  { value: 'daily_activities', label: 'Daily Activities' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'bills', label: 'Bills' },
  { value: 'payments', label: 'Payments' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'census', label: 'Tree Census' },
  { value: 'reports', label: 'Reports' },
  { value: 'esg', label: 'ESG Reports' },
  { value: 'tools_stock', label: 'Tools Stock' },
  { value: 'nursery_inwards', label: 'Nursery Inwards' },
  { value: 'employee_reports', label: 'Employee Reports' },
  { value: 'masters', label: 'Masters' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

function renderProjectActivity(row: Record<string, unknown>, key: string) {
  const pa = row[key] as {
    project?: { name?: string };
    activity?: { name?: string };
    project_area?: { name?: string };
  } | null;
  if (!pa) return '—';
  const base = `${pa.project?.name || '?'} — ${pa.activity?.name || '?'}`;
  return pa.project_area?.name ? `${base} (${pa.project_area.name})` : base;
}

export const stakeholderCategoriesConfig: MasterConfig = {
  title: 'Stakeholder Categories',
  table: 'stakeholder_categories',
  icon: Tags,
  orderBy: 'name',
  searchKeys: ['name', 'code', 'description'],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    { key: 'desc', header: 'Description', render: (r) => String(r.description || '—') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const stakeholderResourcesConfig: MasterConfig = {
  title: 'Stakeholder Resources',
  table: 'stakeholder_resources',
  icon: Link2,
  orderBy: 'created_at',
  selectQuery: '*, stakeholder:stakeholders(name, code), resource:resources_materials(name, code)',
  searchKeys: ['stakeholder', 'resource'],
  fields: [
    {
      name: 'stakeholder_id',
      label: 'Stakeholder',
      type: 'select',
      required: true,
      optionsFrom: { table: 'stakeholders', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'resource_id',
      label: 'Resource',
      type: 'select',
      required: true,
      optionsFrom: {
        table: 'resources_materials',
        valueKey: 'id',
        labelKey: 'name',
        labelSuffixKey: 'code',
      },
    },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'stakeholder',
      header: 'Stakeholder',
      render: (r) => {
        const s = r.stakeholder as { name?: string; code?: string } | null;
        return s ? `${s.name}${s.code ? ` (${s.code})` : ''}` : '—';
      },
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (r) => {
        const res = r.resource as { name?: string; code?: string } | null;
        return res ? `${res.name}${res.code ? ` (${res.code})` : ''}` : '—';
      },
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const stakeholderSupplyRatesConfig: MasterConfig = {
  title: 'Stakeholder Supply Rates',
  table: 'stakeholder_supply_rates',
  icon: IndianRupee,
  orderBy: 'effective_from',
  selectQuery:
    '*, stakeholder:stakeholders(name, code), resource:resources_materials(name, code), project:projects(name, code)',
  searchKeys: ['stakeholder', 'resource', 'project'],
  fields: [
    {
      name: 'stakeholder_id',
      label: 'Stakeholder',
      type: 'select',
      required: true,
      optionsFrom: { table: 'stakeholders', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'resource_id',
      label: 'Resource',
      type: 'select',
      required: true,
      optionsFrom: {
        table: 'resources_materials',
        valueKey: 'id',
        labelKey: 'name',
        labelSuffixKey: 'code',
      },
    },
    {
      name: 'project_id',
      label: 'Project (optional)',
      type: 'select',
      optionsFrom: { table: 'projects', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'rate', label: 'Rate', type: 'number', required: true },
    { name: 'effective_from', label: 'Effective From', type: 'date', required: true },
    { name: 'effective_to', label: 'Effective To', type: 'date' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'stakeholder',
      header: 'Stakeholder',
      render: (r) => {
        const s = r.stakeholder as { name?: string } | null;
        return s?.name || '—';
      },
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (r) => {
        const res = r.resource as { name?: string } | null;
        return res?.name || '—';
      },
    },
    {
      key: 'project',
      header: 'Project',
      render: (r) => {
        const p = r.project as { name?: string } | null;
        return p?.name || 'All projects';
      },
    },
    { key: 'rate', header: 'Rate', render: (r) => formatCurrency(Number(r.rate || 0)) },
    {
      key: 'period',
      header: 'Effective',
      render: (r) => {
        const from = r.effective_from ? formatDate(String(r.effective_from)) : '—';
        const to = r.effective_to ? formatDate(String(r.effective_to)) : 'ongoing';
        return `${from} → ${to}`;
      },
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const stakeholderAccessRightsConfig: MasterConfig = {
  title: 'Stakeholder Access Rights',
  table: 'stakeholder_category_access_rights',
  icon: Shield,
  orderBy: 'module_name',
  searchKeys: ['module_name'],
  fields: [
    {
      name: 'category_id',
      label: 'Stakeholder Category',
      type: 'select',
      required: true,
      optionsFrom: { table: 'stakeholder_categories', valueKey: 'id', labelKey: 'name' },
    },
    { name: 'module_name', label: 'Module', type: 'select', required: true, options: MODULE_NAME_OPTIONS },
    { name: 'can_view', label: 'Can View', type: 'boolean' },
    { name: 'can_create', label: 'Can Create', type: 'boolean' },
    { name: 'can_edit', label: 'Can Edit', type: 'boolean' },
    { name: 'can_delete', label: 'Can Delete', type: 'boolean' },
    { name: 'can_approve', label: 'Can Approve', type: 'boolean' },
  ],
  columns: [
    {
      key: 'category',
      header: 'Category',
      render: (r) => {
        const cat = r.category as { name?: string } | null;
        return cat?.name || '—';
      },
    },
    { key: 'module', header: 'Module', render: (r) => String(r.module_name) },
    { key: 'view', header: 'View', render: (r) => (r.can_view ? 'Yes' : 'No') },
    { key: 'create', header: 'Create', render: (r) => (r.can_create ? 'Yes' : 'No') },
    { key: 'edit', header: 'Edit', render: (r) => (r.can_edit ? 'Yes' : 'No') },
    { key: 'delete', header: 'Delete', render: (r) => (r.can_delete ? 'Yes' : 'No') },
    { key: 'approve', header: 'Approve', render: (r) => (r.can_approve ? 'Yes' : 'No') },
  ],
  selectQuery: '*, category:stakeholder_categories(name)',
  defaultValues: { can_view: true },
};

export const organisationContactsConfig: MasterConfig = {
  title: 'Organisation Contacts',
  table: 'organisation_contacts',
  icon: UserCircle,
  orderBy: 'name',
  selectQuery: '*, organisation:organisations(name, code)',
  searchKeys: ['name', 'email', 'mobile', 'organisation'],
  fields: [
    {
      name: 'organisation_id',
      label: 'Organisation',
      type: 'select',
      required: true,
      optionsFrom: { table: 'organisations', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'name', label: 'Contact Name', type: 'text', required: true },
    { name: 'designation', label: 'Designation', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'mobile', label: 'Mobile', type: 'text' },
    { name: 'is_primary', label: 'Primary Contact', type: 'boolean' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'org',
      header: 'Organisation',
      render: (r) => {
        const org = r.organisation as { name?: string } | null;
        return org?.name || '—';
      },
    },
    { key: 'name', header: 'Name', render: (r) => String(r.name) },
    { key: 'designation', header: 'Designation', render: (r) => String(r.designation || '—') },
    { key: 'mobile', header: 'Mobile', render: (r) => String(r.mobile || '—') },
    { key: 'primary', header: 'Primary', render: (r) => (r.is_primary ? 'Yes' : 'No') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true, is_primary: false },
};

export const organisationCertificatesConfig: MasterConfig = {
  title: 'Organisation Certificates',
  table: 'organisation_certificates',
  icon: Award,
  orderBy: 'expiry_date',
  selectQuery: '*, organisation:organisations(name), certificate:certificates(name)',
  searchKeys: ['certificate_number', 'organisation', 'certificate'],
  fields: [
    {
      name: 'organisation_id',
      label: 'Organisation',
      type: 'select',
      required: true,
      optionsFrom: { table: 'organisations', valueKey: 'id', labelKey: 'name' },
    },
    {
      name: 'certificate_id',
      label: 'Certificate Type',
      type: 'select',
      optionsFrom: { table: 'certificates', valueKey: 'id', labelKey: 'name' },
    },
    { name: 'certificate_number', label: 'Certificate Number', type: 'text' },
    { name: 'issue_date', label: 'Issue Date', type: 'date' },
    { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'org',
      header: 'Organisation',
      render: (r) => {
        const org = r.organisation as { name?: string } | null;
        return org?.name || '—';
      },
    },
    {
      key: 'cert',
      header: 'Certificate',
      render: (r) => {
        const cert = r.certificate as { name?: string } | null;
        return cert?.name || '—';
      },
    },
    { key: 'number', header: 'Number', render: (r) => String(r.certificate_number || '—') },
    {
      key: 'expiry',
      header: 'Expiry',
      render: (r) => (r.expiry_date ? formatDate(String(r.expiry_date)) : '—'),
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const organisationEmployeesConfig: MasterConfig = {
  title: 'Organisation Employees',
  table: 'organisation_employees',
  icon: IdCard,
  orderBy: 'full_name',
  selectQuery: '*, organisation:organisations(name, code), designation:designations(name)',
  searchKeys: ['full_name', 'employee_code', 'mobile', 'email', 'organisation'],
  fields: [
    {
      name: 'organisation_id',
      label: 'Organisation',
      type: 'select',
      required: true,
      optionsFrom: { table: 'organisations', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'employee_code', label: 'Employee Code', type: 'text', required: true },
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    {
      name: 'designation_id',
      label: 'Designation',
      type: 'select',
      optionsFrom: { table: 'designations', valueKey: 'id', labelKey: 'name' },
    },
    { name: 'mobile', label: 'Mobile', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { name: 'date_of_joining', label: 'Date of Joining', type: 'date' },
    { name: 'date_of_leaving', label: 'Date of Leaving', type: 'date' },
    { name: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTIONS },
    { name: 'aadhaar_number', label: 'Aadhaar', type: 'text' },
    { name: 'pan_number', label: 'PAN', type: 'text' },
    { name: 'basic_salary', label: 'Basic Salary', type: 'number' },
    { name: 'gross_salary', label: 'Gross Salary', type: 'number' },
    { name: 'allow_app_login', label: 'Allow App Login', type: 'boolean' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'org',
      header: 'Organisation',
      render: (r) => {
        const org = r.organisation as { name?: string } | null;
        return org?.name || '—';
      },
    },
    { key: 'code', header: 'Code', render: (r) => String(r.employee_code) },
    { key: 'name', header: 'Name', render: (r) => String(r.full_name) },
    {
      key: 'designation',
      header: 'Designation',
      render: (r) => {
        const d = r.designation as { name?: string } | null;
        return d?.name || '—';
      },
    },
    { key: 'mobile', header: 'Mobile', render: (r) => String(r.mobile || '—') },
    { key: 'login', header: 'App Login', render: (r) => (r.allow_app_login ? 'Yes' : 'No') },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true, allow_app_login: false },
};

export const activityResourceRequirementsConfig: MasterConfig = {
  title: 'Activity Resource Requirements',
  table: 'activity_resource_requirements',
  icon: Package,
  orderBy: 'created_at',
  softDelete: false,
  selectQuery:
    '*, project_activity:project_activities(project:projects(name), activity:activities(name), project_area:project_areas(name)), resource:resources_materials(name, code)',
  searchKeys: ['project_activity', 'resource'],
  fields: [
    {
      name: 'project_activity_id',
      label: 'Project Activity',
      type: 'select',
      required: true,
      optionsFrom: PROJECT_ACTIVITY_OPTIONS,
    },
    {
      name: 'resource_id',
      label: 'Resource',
      type: 'select',
      required: true,
      optionsFrom: {
        table: 'resources_materials',
        valueKey: 'id',
        labelKey: 'name',
        labelSuffixKey: 'code',
      },
    },
    { name: 'required_quantity', label: 'Required Quantity', type: 'number', required: true },
    { name: 'unit_rate', label: 'Unit Rate', type: 'number' },
  ],
  columns: [
    {
      key: 'activity',
      header: 'Project Activity',
      render: (r) => renderProjectActivity(r, 'project_activity'),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (r) => {
        const res = r.resource as { name?: string } | null;
        return res?.name || '—';
      },
    },
    {
      key: 'qty',
      header: 'Qty Required',
      render: (r) => formatNumber(Number(r.required_quantity || 0)),
    },
    {
      key: 'rate',
      header: 'Unit Rate',
      render: (r) => (r.unit_rate != null ? formatCurrency(Number(r.unit_rate)) : '—'),
    },
  ],
};

export const activityContractorAllocationsConfig: MasterConfig = {
  title: 'Activity Contractor Allocations',
  table: 'activity_contractor_allocations',
  icon: HardHat,
  orderBy: 'start_date',
  selectQuery:
    '*, project_activity:project_activities(project:projects(name), activity:activities(name)), stakeholder:stakeholders(name, code)',
  searchKeys: ['project_activity', 'stakeholder'],
  fields: [
    {
      name: 'project_activity_id',
      label: 'Project Activity',
      type: 'select',
      required: true,
      optionsFrom: PROJECT_ACTIVITY_OPTIONS,
    },
    {
      name: 'stakeholder_id',
      label: 'Contractor / Stakeholder',
      type: 'select',
      required: true,
      optionsFrom: { table: 'stakeholders', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'allocated_quantity', label: 'Allocated Quantity', type: 'number' },
    { name: 'rate', label: 'Rate', type: 'number' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'activity',
      header: 'Project Activity',
      render: (r) => renderProjectActivity(r, 'project_activity'),
    },
    {
      key: 'stakeholder',
      header: 'Stakeholder',
      render: (r) => {
        const s = r.stakeholder as { name?: string } | null;
        return s?.name || '—';
      },
    },
    {
      key: 'qty',
      header: 'Allocated',
      render: (r) =>
        r.allocated_quantity != null ? formatNumber(Number(r.allocated_quantity)) : '—',
    },
    { key: 'rate', header: 'Rate', render: (r) => (r.rate != null ? formatCurrency(Number(r.rate)) : '—') },
    {
      key: 'period',
      header: 'Period',
      render: (r) => {
        const start = r.start_date ? formatDate(String(r.start_date)) : '—';
        const end = r.end_date ? formatDate(String(r.end_date)) : '—';
        return `${start} → ${end}`;
      },
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const workContractsConfig: MasterConfig = {
  title: 'Work Contracts',
  table: 'work_contracts',
  icon: FileSignature,
  orderBy: 'contract_date',
  selectQuery: '*, project:projects(name, code), stakeholder:stakeholders(name, code)',
  searchKeys: ['contract_number', 'project', 'stakeholder'],
  fields: [
    {
      name: 'project_id',
      label: 'Project',
      type: 'select',
      required: true,
      optionsFrom: { table: 'projects', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'stakeholder_id',
      label: 'Stakeholder',
      type: 'select',
      required: true,
      optionsFrom: { table: 'stakeholders', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'contract_number', label: 'Contract Number', type: 'text' },
    { name: 'contract_date', label: 'Contract Date', type: 'date', required: true },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'total_value', label: 'Total Value', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: CONTRACT_STATUS_OPTIONS },
    { name: 'terms_and_conditions', label: 'Terms & Conditions', type: 'textarea' },
  ],
  columns: [
    { key: 'number', header: 'Contract #', render: (r) => String(r.contract_number || '—') },
    {
      key: 'project',
      header: 'Project',
      render: (r) => {
        const p = r.project as { name?: string } | null;
        return p?.name || '—';
      },
    },
    {
      key: 'stakeholder',
      header: 'Stakeholder',
      render: (r) => {
        const s = r.stakeholder as { name?: string } | null;
        return s?.name || '—';
      },
    },
    {
      key: 'date',
      header: 'Contract Date',
      render: (r) => formatDate(String(r.contract_date)),
    },
    {
      key: 'value',
      header: 'Value',
      render: (r) => (r.total_value != null ? formatCurrency(Number(r.total_value)) : '—'),
    },
    { key: 'status', header: 'Status', render: (r) => String(r.status) },
  ],
  defaultValues: { status: 'draft' },
};

export const workContractItemsConfig: MasterConfig = {
  title: 'Work Contract Items',
  table: 'work_contract_items',
  icon: ListOrdered,
  orderBy: 'created_at',
  softDelete: false,
  selectQuery:
    '*, contract:work_contracts(contract_number, project:projects(name)), resource:resources_materials(name), activity:activities(name)',
  searchKeys: ['description', 'contract'],
  fields: [
    {
      name: 'contract_id',
      label: 'Work Contract',
      type: 'select',
      required: true,
      optionsFrom: {
        table: 'work_contracts',
        valueKey: 'id',
        labelKey: 'contract_number',
        selectQuery: 'id, contract_number, project:projects(name)',
        formatLabel: (row) => {
          const project = row.project as { name?: string } | null;
          const num = String(row.contract_number || row.id);
          return project?.name ? `${num} — ${project.name}` : num;
        },
      },
    },
    {
      name: 'resource_id',
      label: 'Resource',
      type: 'select',
      optionsFrom: {
        table: 'resources_materials',
        valueKey: 'id',
        labelKey: 'name',
        labelSuffixKey: 'code',
      },
    },
    {
      name: 'activity_id',
      label: 'Activity',
      type: 'select',
      optionsFrom: { table: 'activities', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'unit_rate', label: 'Unit Rate', type: 'number' },
    { name: 'total_amount', label: 'Total Amount', type: 'number' },
  ],
  columns: [
    {
      key: 'contract',
      header: 'Contract',
      render: (r) => {
        const c = r.contract as { contract_number?: string; project?: { name?: string } } | null;
        if (!c) return '—';
        return c.contract_number
          ? `${c.contract_number}${c.project?.name ? ` (${c.project.name})` : ''}`
          : '—';
      },
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (r) => {
        const res = r.resource as { name?: string } | null;
        return res?.name || '—';
      },
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (r) => {
        const a = r.activity as { name?: string } | null;
        return a?.name || '—';
      },
    },
    { key: 'desc', header: 'Description', render: (r) => String(r.description || '—') },
    {
      key: 'qty',
      header: 'Qty',
      render: (r) => (r.quantity != null ? formatNumber(Number(r.quantity)) : '—'),
    },
    {
      key: 'total',
      header: 'Total',
      render: (r) => (r.total_amount != null ? formatCurrency(Number(r.total_amount)) : '—'),
    },
  ],
};
