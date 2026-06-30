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
  FolderKanban,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { ROLE_LABELS } from '@/types/database';
import { formatProjectStatus } from '@/lib/projects';
import { formatAreaRef, formatProjectCode, projectAreaParentText, projectAreaProjectText, projectActivityActivityKey, projectActivityActivityText, projectActivityAreaKey, projectActivityAreaText, projectActivityProjectText, resourceCategoryKey, resourceCategoryText, resourceTreeSpeciesKey, resourceTreeSpeciesText } from '@/lib/master-display';
import type { MasterConfig } from '@/lib/master-types';

const USER_ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const USER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const PROJECT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AREA_LEVEL_OPTIONS = [
  { value: '1', label: 'Level 1 (Zone)' },
  { value: '2', label: 'Level 2 (Block)' },
  { value: '3', label: 'Level 3 (Plot)' },
];

export const yearsConfig: MasterConfig = {
  title: 'Years',
  table: 'years',
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
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
  imageAttachments: true,
  icon: Package,
  orderBy: 'name',
  selectQuery: '*, resource_category:resource_categories(name, category_type)',
  searchKeys: ['name', 'code', 'description', 'resource_category'],
  columnFilters: [
    {
      id: 'tree',
      label: 'Tree Species',
      mode: 'multiselect',
      placeholder: 'All',
      staticOptions: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      getValue: resourceTreeSpeciesText,
      getKey: resourceTreeSpeciesKey,
    },
    {
      id: 'category',
      label: 'Category',
      mode: 'multiselect',
      placeholder: 'All categories',
      getValue: resourceCategoryText,
      getKey: resourceCategoryKey,
    },
  ],
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

export const projectsConfig: MasterConfig = {
  title: 'Projects',
  table: 'projects',
  imageAttachments: true,
  icon: FolderKanban,
  orderBy: 'name',
  selectQuery: '*, year:years(year_label), csr_partner:csr_partners(name), organisation:organisations(name)',
  searchKeys: ['name', 'code', 'location', 'district', 'state'],
  fields: [
    {
      name: 'year_id',
      label: 'Year',
      type: 'select',
      required: true,
      optionsFrom: { table: 'years', valueKey: 'id', labelKey: 'year_label' },
    },
    {
      name: 'csr_partner_id',
      label: 'CSR Partner',
      type: 'select',
      required: true,
      optionsFrom: { table: 'csr_partners', valueKey: 'id', labelKey: 'name' },
    },
    {
      name: 'organisation_id',
      label: 'Organisation',
      type: 'select',
      required: true,
      optionsFrom: { table: 'organisations', valueKey: 'id', labelKey: 'name' },
    },
    { name: 'name', label: 'Project Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'total_land_area_acres', label: 'Total Land (acres)', type: 'number', required: true },
    { name: 'total_trees_planned', label: 'Trees Planned', type: 'number', required: true },
    { name: 'budget_amount', label: 'Budget', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: PROJECT_STATUS_OPTIONS },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'district', label: 'District', type: 'text' },
    { name: 'state', label: 'State', type: 'text' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { key: 'name', header: 'Project', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    {
      key: 'year',
      header: 'Year',
      render: (r) => {
        const year = r.year as { year_label?: string } | null;
        return year?.year_label || '—';
      },
    },
    {
      key: 'csr',
      header: 'CSR Partner',
      render: (r) => {
        const partner = r.csr_partner as { name?: string } | null;
        return partner?.name || '—';
      },
    },
    {
      key: 'org',
      header: 'Organisation',
      render: (r) => {
        const org = r.organisation as { name?: string } | null;
        return org?.name || '—';
      },
    },
    { key: 'status', header: 'Status', render: (r) => formatProjectStatus(String(r.status)) },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { status: 'draft', total_land_area_acres: 0, total_trees_planned: 0, budget_amount: 0, is_active: true },
};

export const projectAreasConfig: MasterConfig = {
  title: 'Project Areas',
  table: 'project_areas',
  imageAttachments: true,
  icon: MapPin,
  orderBy: 'level',
  selectQuery:
    '*, project:projects(name, code), parent_area:parent_area_id(name, code)',
  searchKeys: ['name', 'code', 'description', 'project', 'parent_area'],
  columnFilters: [
    {
      id: 'project',
      label: 'Project',
      placeholder: 'Filter by project…',
      getValue: projectAreaProjectText,
    },
    {
      id: 'parent',
      label: 'Parent',
      placeholder: 'Filter by parent area…',
      getValue: projectAreaParentText,
    },
    {
      id: 'code',
      label: 'Code',
      placeholder: 'Filter by code…',
      getValue: (row) => String(row.code ?? ''),
    },
    {
      id: 'area',
      label: 'Area',
      placeholder: 'Filter by area name…',
      getValue: (row) => String(row.name ?? ''),
    },
  ],
  fields: [
    {
      name: 'project_id',
      label: 'Project',
      type: 'select',
      required: true,
      optionsFrom: { table: 'projects', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'parent_area_id',
      label: 'Parent Area',
      type: 'select',
      optionsFrom: { table: 'project_areas', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'level', label: 'Level', type: 'select', required: true, options: AREA_LEVEL_OPTIONS, coerceNumber: true },
    { name: 'name', label: 'Area Name', type: 'text', required: true },
    { name: 'code', label: 'Code', type: 'text' },
    { name: 'land_area_acres', label: 'Land Area (acres)', type: 'number', required: true },
    { name: 'trees_planned', label: 'Trees Planned', type: 'number', required: true },
    { name: 'trees_planted', label: 'Trees Planted', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'project',
      header: 'Proj Code',
      render: (r) => formatProjectCode(r.project),
    },
    { key: 'level', header: 'Level', render: (r) => String(r.level) },
    { key: 'name', header: 'Area', render: (r) => String(r.name) },
    { key: 'code', header: 'Code', render: (r) => String(r.code || '—') },
    {
      key: 'parent',
      header: 'Parent',
      render: (r) => formatAreaRef(r.parent_area) || '—',
    },
    {
      key: 'land',
      header: 'Land (acres)',
      render: (r) => formatNumber(Number(r.land_area_acres || 0)),
    },
    {
      key: 'trees',
      header: 'Trees',
      render: (r) => `${formatNumber(Number(r.trees_planted || 0))} / ${formatNumber(Number(r.trees_planned || 0))}`,
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { level: 1, land_area_acres: 0, trees_planned: 0, trees_planted: 0, is_active: true },
};

export const projectActivitiesConfig: MasterConfig = {
  title: 'Project Activities',
  table: 'project_activities',
  imageAttachments: true,
  icon: Activity,
  orderBy: 'planned_start_date',
  selectQuery:
    '*, project:projects(name, code), activity:activities(id, name, code), project_area:project_areas(id, name, code)',
  searchKeys: ['planned_quantity', 'project', 'activity', 'project_area'],
  columnFilters: [
    {
      id: 'project',
      label: 'Project',
      placeholder: 'Filter by project…',
      getValue: projectActivityProjectText,
    },
    {
      id: 'area',
      label: 'Project Area',
      mode: 'multiselect',
      placeholder: 'All areas',
      getValue: projectActivityAreaText,
      getKey: projectActivityAreaKey,
    },
    {
      id: 'activity',
      label: 'Activity',
      mode: 'multiselect',
      placeholder: 'All activities',
      getValue: projectActivityActivityText,
      getKey: projectActivityActivityKey,
    },
  ],
  fields: [
    {
      name: 'project_id',
      label: 'Project',
      type: 'select',
      required: true,
      optionsFrom: { table: 'projects', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'activity_id',
      label: 'Activity',
      type: 'select',
      required: true,
      optionsFrom: { table: 'activities', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'project_area_id',
      label: 'Project Area',
      type: 'select',
      optionsFrom: { table: 'project_areas', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    { name: 'planned_quantity', label: 'Planned Quantity', type: 'number' },
    { name: 'planned_start_date', label: 'Planned Start', type: 'date' },
    { name: 'planned_end_date', label: 'Planned End', type: 'date' },
    { name: 'budget_amount', label: 'Budget', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'boolean' },
  ],
  columns: [
    {
      key: 'project',
      header: 'Proj Code',
      render: (r) => formatProjectCode(r.project),
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (r) => {
        const activity = r.activity as { name?: string } | null;
        return activity?.name || '—';
      },
    },
    {
      key: 'area',
      header: 'Area',
      render: (r) => {
        const area = r.project_area as { name?: string } | null;
        return area?.name || 'All areas';
      },
    },
    {
      key: 'qty',
      header: 'Planned Qty',
      render: (r) => (r.planned_quantity != null ? formatNumber(Number(r.planned_quantity)) : '—'),
    },
    {
      key: 'dates',
      header: 'Planned Period',
      render: (r) => {
        const start = r.planned_start_date ? formatDate(String(r.planned_start_date)) : '—';
        const end = r.planned_end_date ? formatDate(String(r.planned_end_date)) : '—';
        return `${start} → ${end}`;
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (r) => (r.budget_amount != null ? formatCurrency(Number(r.budget_amount)) : '—'),
    },
    { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
  ],
  defaultValues: { is_active: true },
};

export const projectUserAccessConfig: MasterConfig = {
  title: 'Project User Access',
  table: 'project_user_access',
  imageAttachments: true,
  icon: UserCheck,
  orderBy: 'created_at',
  softDelete: false,
  selectQuery: '*, project:projects(name, code), user:users(full_name, mobile, email)',
  searchKeys: ['project', 'user'],
  fields: [
    {
      name: 'project_id',
      label: 'Project',
      type: 'select',
      required: true,
      optionsFrom: { table: 'projects', valueKey: 'id', labelKey: 'name', labelSuffixKey: 'code' },
    },
    {
      name: 'user_id',
      label: 'User',
      type: 'select',
      required: true,
      optionsFrom: { table: 'users', valueKey: 'id', labelKey: 'full_name', labelSuffixKey: 'mobile' },
    },
  ],
  columns: [
    {
      key: 'project',
      header: 'Proj Code',
      render: (r) => formatProjectCode(r.project),
    },
    {
      key: 'user',
      header: 'User',
      render: (r) => {
        const user = r.user as { full_name?: string; mobile?: string } | null;
        return user ? `${user.full_name} (${user.mobile})` : '—';
      },
    },
    {
      key: 'created',
      header: 'Granted',
      render: (r) => (r.created_at ? formatDate(String(r.created_at)) : '—'),
    },
  ],
};

export const usersConfig: MasterConfig = {
  title: 'Users',
  table: 'users',
  imageAttachments: true,
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
