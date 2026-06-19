-- SocialForest Database Schema
-- CSR Agroforestry Project Management System

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'csr_partner',
  'organisation',
  'stakeholder',
  'organisation_employee'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'on_hold', 'cancelled');

CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'completed');

CREATE TYPE bill_status AS ENUM ('draft', 'submitted', 'approved', 'paid', 'rejected');

CREATE TYPE invoice_status AS ENUM ('draft', 'submitted', 'approved', 'paid', 'rejected');

CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave', 'holiday');

CREATE TYPE nursery_issue_category AS ENUM ('plantation', 'replacement');

CREATE TYPE stock_transaction_type AS ENUM ('inward', 'issue', 'damage', 'missing', 'return');

CREATE TYPE tree_health_status AS ENUM ('healthy', 'stressed', 'diseased', 'dead', 'replaced');

-- ============================================================
-- MASTER TABLES
-- ============================================================

-- Year Master
CREATE TABLE years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_label VARCHAR(20) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designation Master
CREATE TABLE designations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Master
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  validity_period_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CSR Master (CSR Partners)
CREATE TABLE csr_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  contact_person VARCHAR(100),
  email VARCHAR(255),
  mobile VARCHAR(15),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gstin VARCHAR(20),
  pan VARCHAR(15),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation Master
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gstin VARCHAR(20),
  pan VARCHAR(15),
  cin VARCHAR(25),
  logo_url TEXT,
  header_template TEXT,
  footer_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation Contact Persons (multiple per org)
CREATE TABLE organisation_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  email VARCHAR(255),
  mobile VARCHAR(15),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation Certificate Attachments (multiple per org)
CREATE TABLE organisation_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES certificates(id),
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Master (profiles linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(255),
  full_name VARCHAR(200) NOT NULL,
  role user_role NOT NULL,
  status user_status DEFAULT 'active',
  avatar_url TEXT,
  -- Link to respective entity based on role
  csr_partner_id UUID REFERENCES csr_partners(id),
  organisation_id UUID REFERENCES organisations(id),
  stakeholder_id UUID, -- FK added after stakeholders table
  organisation_employee_id UUID, -- FK added after employees table
  created_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation Employee Master (statutory columns)
CREATE TABLE organisation_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  employee_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  designation_id UUID REFERENCES designations(id),
  mobile VARCHAR(15),
  email VARCHAR(255),
  date_of_birth DATE,
  date_of_joining DATE,
  date_of_leaving DATE,
  gender VARCHAR(10),
  father_name VARCHAR(200),
  permanent_address TEXT,
  current_address TEXT,
  -- Statutory columns
  aadhaar_number VARCHAR(12),
  pan_number VARCHAR(15),
  uan_number VARCHAR(20),
  esic_number VARCHAR(20),
  pf_number VARCHAR(25),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(30),
  bank_ifsc VARCHAR(15),
  -- Salary details
  basic_salary DECIMAL(12,2),
  hra DECIMAL(12,2),
  conveyance DECIMAL(12,2),
  other_allowances DECIMAL(12,2),
  gross_salary DECIMAL(12,2),
  -- App access
  allow_app_login BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, employee_code)
);

ALTER TABLE users ADD CONSTRAINT fk_users_employee
  FOREIGN KEY (organisation_employee_id) REFERENCES organisation_employees(id);

-- Stakeholder Category Master
CREATE TABLE stakeholder_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholders Master (Contractors, Suppliers, etc.)
CREATE TABLE stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES stakeholder_categories(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  contact_person VARCHAR(100),
  mobile VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gstin VARCHAR(20),
  pan VARCHAR(15),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(30),
  bank_ifsc VARCHAR(15),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_users_stakeholder
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id);

-- Stakeholder Category Wise App Access Rights
CREATE TABLE stakeholder_category_access_rights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES stakeholder_categories(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, module_name)
);

-- ============================================================
-- PROJECT TABLES
-- ============================================================

-- Year-wise Projects Master
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_id UUID NOT NULL REFERENCES years(id),
  csr_partner_id UUID NOT NULL REFERENCES csr_partners(id),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  total_land_area_acres DECIMAL(12,4) NOT NULL DEFAULT 0,
  total_trees_planned INTEGER NOT NULL DEFAULT 0,
  budget_amount DECIMAL(15,2) DEFAULT 0,
  status project_status DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  location TEXT,
  district VARCHAR(100),
  state VARCHAR(100),
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Areas (up to 3 levels hierarchy)
CREATE TABLE project_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_area_id UUID REFERENCES project_areas(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  land_area_acres DECIMAL(12,4) NOT NULL DEFAULT 0,
  trees_planned INTEGER NOT NULL DEFAULT 0,
  trees_planted INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project User Access (which users can access which projects)
CREATE TABLE project_user_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================
-- ACTIVITIES & RESOURCES
-- ============================================================

-- Activities Master
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  unit_of_measurement VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources/Materials Master
CREATE TABLE resources_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  unit_of_measurement VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  is_tree_species BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholder Resources Master (what resources a stakeholder can supply)
CREATE TABLE stakeholder_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stakeholder_id, resource_id)
);

-- Stakeholder-wise Supply Rate Master
CREATE TABLE stakeholder_supply_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  project_id UUID REFERENCES projects(id),
  rate DECIMAL(12,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project-wise Activities
CREATE TABLE project_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id),
  project_area_id UUID REFERENCES project_areas(id),
  planned_quantity DECIMAL(12,2),
  planned_start_date DATE,
  planned_end_date DATE,
  budget_amount DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity-wise Resource/Material Requirement Planning
CREATE TABLE activity_resource_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_activity_id UUID NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  required_quantity DECIMAL(12,2) NOT NULL,
  unit_rate DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Contractor Allocation
CREATE TABLE activity_contractor_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_activity_id UUID NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  allocated_quantity DECIMAL(12,2),
  rate DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Contracts to Stakeholders
CREATE TABLE work_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  contract_number VARCHAR(50) UNIQUE,
  contract_date DATE NOT NULL,
  start_date DATE,
  end_date DATE,
  total_value DECIMAL(15,2),
  status contract_status DEFAULT 'draft',
  terms_and_conditions TEXT,
  document_url TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Contract Line Items (resources with rates)
CREATE TABLE work_contract_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES work_contracts(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources_materials(id),
  activity_id UUID REFERENCES activities(id),
  description TEXT,
  quantity DECIMAL(12,2),
  unit_rate DECIMAL(12,2),
  total_amount DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY OPERATIONS
-- ============================================================

-- Daily Activity Updates by Stakeholders
CREATE TABLE daily_activity_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  project_activity_id UUID NOT NULL REFERENCES project_activities(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  project_area_id UUID REFERENCES project_areas(id),
  activity_date DATE NOT NULL,
  quantity_completed DECIMAL(12,2),
  remarks TEXT,
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Activity Images (proof of work)
CREATE TABLE daily_activity_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_activity_id UUID NOT NULL REFERENCES daily_activity_updates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources/Materials Used in Daily Activities
CREATE TABLE daily_activity_resources_used (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_activity_id UUID NOT NULL REFERENCES daily_activity_updates(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  quantity_used DECIMAL(12,2) NOT NULL,
  unit_rate DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project-wise Organisation Daily Attendance
CREATE TABLE daily_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  employee_id UUID NOT NULL REFERENCES organisation_employees(id),
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, employee_id, attendance_date)
);

-- ============================================================
-- BILLING & PAYMENTS
-- ============================================================

-- Stakeholder Bills (generated from daily activities)
CREATE TABLE stakeholder_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  bill_number VARCHAR(50) UNIQUE,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status bill_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stakeholder Bill Line Items
CREATE TABLE stakeholder_bill_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES stakeholder_bills(id) ON DELETE CASCADE,
  daily_activity_id UUID REFERENCES daily_activity_updates(id),
  description TEXT,
  quantity DECIMAL(12,2),
  unit_rate DECIMAL(12,2),
  amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Invoices to CSR Partner
CREATE TABLE contractor_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  invoice_number VARCHAR(50) UNIQUE,
  invoice_date DATE NOT NULL,
  period_from DATE,
  period_to DATE,
  total_amount DECIMAL(15,2) NOT NULL,
  status invoice_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Invoice Attachments
CREATE TABLE contractor_invoice_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES contractor_invoices(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments by Organisation to Stakeholders
CREATE TABLE payments_to_stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  bill_id UUID REFERENCES stakeholder_bills(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(50),
  reference_number VARCHAR(100),
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipt of Payment from CSR to Organisation
CREATE TABLE csr_payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  csr_partner_id UUID NOT NULL REFERENCES csr_partners(id),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  receipt_number VARCHAR(50),
  receipt_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(50),
  reference_number VARCHAR(100),
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CSR Payment Receipt Attachments
CREATE TABLE csr_payment_receipt_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES csr_payment_receipts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTRACTOR EXPENSES & REPORTS
-- ============================================================

-- Contractor-wise Expenses for Project
CREATE TABLE contractor_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  expense_date DATE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  vendor_name VARCHAR(200),
  invoice_number VARCHAR(50),
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Expense Attachments (purchase invoices/proof)
CREATE TABLE contractor_expense_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES contractor_expenses(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Employee Monthly Reports (Attendance & Salary)
CREATE TABLE contractor_employee_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  report_month DATE NOT NULL, -- First day of month
  report_type VARCHAR(50) NOT NULL, -- 'attendance', 'salary', 'statutory'
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TREE CENSUS & MONITORING
-- ============================================================

-- Periodical Tree Census/Status Updates
CREATE TABLE tree_census_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  project_area_id UUID REFERENCES project_areas(id),
  census_date DATE NOT NULL,
  total_trees_counted INTEGER NOT NULL,
  healthy_count INTEGER DEFAULT 0,
  stressed_count INTEGER DEFAULT 0,
  diseased_count INTEGER DEFAULT 0,
  dead_count INTEGER DEFAULT 0,
  replaced_count INTEGER DEFAULT 0,
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tree Census Images
CREATE TABLE tree_census_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  census_id UUID NOT NULL REFERENCES tree_census_updates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  tree_health_status tree_health_status,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TOOLS STOCK MANAGEMENT
-- ============================================================

-- Project-wise Tools Purchased by Contractors
CREATE TABLE contractor_tools_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  tool_name VARCHAR(200) NOT NULL,
  tool_code VARCHAR(50),
  description TEXT,
  quantity_purchased INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  purchase_date DATE,
  purchase_amount DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools Stock Transactions
CREATE TABLE tools_stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_stock_id UUID NOT NULL REFERENCES contractor_tools_stock(id) ON DELETE CASCADE,
  transaction_type stock_transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  transaction_date DATE NOT NULL,
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CENTRALIZED NURSERY
-- ============================================================

-- Nursery Inwards (trees brought by contractors)
CREATE TABLE nursery_inwards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  inward_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  remarks TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nursery Issues (plantation/replacement)
CREATE TABLE nursery_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  project_area_id UUID REFERENCES project_areas(id),
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  issue_category nursery_issue_category NOT NULL,
  issue_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  remarks TEXT,
  issued_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nursery Stock View (computed via view)
CREATE OR REPLACE VIEW nursery_stock AS
SELECT
  rm.id AS resource_id,
  rm.name AS resource_name,
  rm.code AS resource_code,
  COALESCE(SUM(ni.quantity), 0) AS total_inward,
  COALESCE(SUM(nis.quantity), 0) AS total_issued,
  COALESCE(SUM(ni.quantity), 0) - COALESCE(SUM(nis.quantity), 0) AS current_stock
FROM resources_materials rm
LEFT JOIN nursery_inwards ni ON ni.resource_id = rm.id
LEFT JOIN nursery_issues nis ON nis.resource_id = rm.id
WHERE rm.is_tree_species = true
GROUP BY rm.id, rm.name, rm.code;

-- ============================================================
-- NOTIFICATIONS & INTEGRATIONS
-- ============================================================

-- WhatsApp Notification Log
CREATE TABLE whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_mobile VARCHAR(15) NOT NULL,
  recipient_name VARCHAR(200),
  message_type VARCHAR(100) NOT NULL,
  message_content TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG Report Schedule
CREATE TABLE esg_report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  csr_partner_id UUID NOT NULL REFERENCES csr_partners(id),
  frequency VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  next_report_date DATE,
  last_sent_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG Report History
CREATE TABLE esg_report_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES esg_report_schedules(id),
  report_period_from DATE NOT NULL,
  report_period_to DATE NOT NULL,
  report_file_url TEXT,
  sent_to_email VARCHAR(255),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_year ON projects(year_id);
CREATE INDEX idx_projects_csr ON projects(csr_partner_id);
CREATE INDEX idx_projects_org ON projects(organisation_id);
CREATE INDEX idx_project_areas_project ON project_areas(project_id);
CREATE INDEX idx_project_areas_parent ON project_areas(parent_area_id);
CREATE INDEX idx_daily_activities_date ON daily_activity_updates(activity_date);
CREATE INDEX idx_daily_activities_project ON daily_activity_updates(project_id);
CREATE INDEX idx_daily_attendance_date ON daily_attendance(attendance_date);
CREATE INDEX idx_stakeholder_bills_status ON stakeholder_bills(status);
CREATE INDEX idx_contractor_invoices_status ON contractor_invoices(status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END;
$$;
