export type UserRole =
  | 'admin'
  | 'csr_partner'
  | 'organisation'
  | 'stakeholder'
  | 'organisation_employee';

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'on_hold' | 'cancelled';
export type BillStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type InvoiceStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
export type NurseryIssueCategory = 'plantation' | 'replacement';
export type StockTransactionType = 'inward' | 'issue' | 'damage' | 'missing' | 'return';

export interface User {
  id: string;
  mobile: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  csr_partner_id: string | null;
  organisation_id: string | null;
  stakeholder_id: string | null;
  organisation_employee_id: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Year {
  id: string;
  year_label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CsrPartner {
  id: string;
  name: string;
  code: string | null;
  contact_person: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface Organisation {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  pan: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface OrganisationEmployee {
  id: string;
  organisation_id: string;
  employee_code: string;
  full_name: string;
  designation_id: string | null;
  mobile: string | null;
  email: string | null;
  date_of_joining: string | null;
  aadhaar_number: string | null;
  pan_number: string | null;
  uan_number: string | null;
  esic_number: string | null;
  pf_number: string | null;
  basic_salary: number | null;
  gross_salary: number | null;
  allow_app_login: boolean;
  is_active: boolean;
}

export interface StakeholderCategory {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
}

export interface Stakeholder {
  id: string;
  category_id: string;
  name: string;
  code: string | null;
  contact_person: string | null;
  mobile: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  is_active: boolean;
}

export interface Project {
  id: string;
  year_id: string;
  csr_partner_id: string;
  organisation_id: string;
  name: string;
  code: string | null;
  description: string | null;
  total_land_area_acres: number;
  total_trees_planned: number;
  budget_amount: number;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_active: boolean;
  year?: Year;
  csr_partner?: CsrPartner;
  organisation?: Organisation;
}

export interface ProjectArea {
  id: string;
  project_id: string;
  parent_area_id: string | null;
  level: 1 | 2 | 3;
  name: string;
  code: string | null;
  land_area_acres: number;
  trees_planned: number;
  trees_planted: number;
  children?: ProjectArea[];
}

export interface Activity {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  unit_of_measurement: string | null;
  is_active: boolean;
}

export interface ResourceMaterial {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  unit_of_measurement: string;
  category: string | null;
  is_tree_species: boolean;
  is_active: boolean;
}

export interface DailyActivityUpdate {
  id: string;
  project_id: string;
  project_activity_id: string;
  stakeholder_id: string;
  project_area_id: string | null;
  activity_date: string;
  quantity_completed: number | null;
  remarks: string | null;
  submitted_by: string | null;
  images?: { id: string; image_url: string; caption: string | null }[];
  resources_used?: { id: string; resource_id: string; quantity_used: number; unit_rate: number | null }[];
}

export interface StakeholderBill {
  id: string;
  project_id: string;
  stakeholder_id: string;
  bill_number: string | null;
  period_from: string;
  period_to: string;
  total_amount: number;
  status: BillStatus;
  submitted_at: string | null;
}

export interface DailyAttendance {
  id: string;
  project_id: string;
  organisation_id: string;
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  employee?: OrganisationEmployee;
}

export interface TreeCensusUpdate {
  id: string;
  project_id: string;
  project_area_id: string | null;
  census_date: string;
  total_trees_counted: number;
  healthy_count: number;
  stressed_count: number;
  diseased_count: number;
  dead_count: number;
  replaced_count: number;
  remarks: string | null;
}

export interface NurseryStock {
  resource_id: string;
  resource_name: string;
  resource_code: string | null;
  total_inward: number;
  total_issued: number;
  current_stock: number;
}

export interface ProjectDashboard {
  project: Project;
  total_trees_planted: number;
  total_activities_completed: number;
  budget_utilized: number;
  budget_remaining: number;
  active_stakeholders: number;
  pending_bills: number;
  recent_activities: DailyActivityUpdate[];
}

export interface LoginSession {
  user: User;
  selectedYear: Year;
  selectedProject: Project;
}

export const MODULE_ACCESS: Record<UserRole, string[]> = {
  admin: ['*'],
  csr_partner: ['dashboard', 'projects', 'reports', 'esg'],
  organisation: [
    'dashboard', 'projects', 'daily_activities', 'attendance', 'bills',
    'payments', 'invoices', 'expenses', 'nursery', 'census', 'reports',
  ],
  stakeholder: [
    'dashboard', 'daily_activities', 'bills', 'invoices', 'expenses',
    'tools_stock', 'nursery_inwards', 'employee_reports',
  ],
  organisation_employee: ['daily_activities', 'attendance'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  csr_partner: 'CSR Partner',
  organisation: 'Organisation',
  stakeholder: 'Stakeholder / Contractor',
  organisation_employee: 'Organisation Employee',
};
