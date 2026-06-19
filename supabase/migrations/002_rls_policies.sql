-- Row Level Security Policies for SocialForest

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_category_access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_supply_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_resource_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_contractor_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_resources_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_invoice_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_to_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_payment_receipt_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_employee_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_census_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_census_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_tools_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_inwards ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_report_history ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get user's accessible project IDs
CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS SETOF UUID AS $$
BEGIN
  IF is_admin() THEN
    RETURN QUERY SELECT id FROM projects WHERE is_active = true;
  ELSE
    RETURN QUERY
      SELECT pua.project_id FROM project_user_access pua
      WHERE pua.user_id = auth.uid()
      UNION
      SELECT p.id FROM projects p
      JOIN users u ON u.id = auth.uid()
      WHERE (u.role = 'csr_partner' AND p.csr_partner_id = u.csr_partner_id)
         OR (u.role = 'organisation' AND p.organisation_id = u.organisation_id)
         OR (u.role = 'stakeholder' AND EXISTS (
           SELECT 1 FROM activity_contractor_allocations aca
           JOIN project_activities pa ON pa.id = aca.project_activity_id
           WHERE pa.project_id = p.id AND aca.stakeholder_id = u.stakeholder_id
         ));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- ADMIN POLICIES (full access)
-- ============================================================

CREATE POLICY admin_all_users ON users FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_years ON years FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_designations ON designations FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_certificates ON certificates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_csr ON csr_partners FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_orgs ON organisations FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_stakeholders ON stakeholders FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_projects ON projects FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- READ POLICIES (all authenticated users can read masters)
-- ============================================================

CREATE POLICY read_years ON years FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY read_designations ON designations FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY read_certificates ON certificates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY read_activities ON activities FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY read_resources ON resources_materials FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY read_stakeholder_categories ON stakeholder_categories FOR SELECT TO authenticated USING (is_active = true);

-- ============================================================
-- USER SELF ACCESS
-- ============================================================

CREATE POLICY users_read_own ON users FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());

CREATE POLICY users_update_own ON users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- PROJECT ACCESS POLICIES
-- ============================================================

CREATE POLICY project_access ON projects FOR SELECT TO authenticated
  USING (id IN (SELECT get_user_project_ids()) OR is_admin());

CREATE POLICY project_areas_access ON project_areas FOR SELECT TO authenticated
  USING (project_id IN (SELECT get_user_project_ids()) OR is_admin());

CREATE POLICY project_user_access_read ON project_user_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- ROLE-SPECIFIC POLICIES
-- ============================================================

-- CSR Partner: view their projects and progress
CREATE POLICY csr_view_projects ON projects FOR SELECT TO authenticated
  USING (
    csr_partner_id = (SELECT csr_partner_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'csr_partner'
  );

-- Organisation: manage their projects
CREATE POLICY org_manage_projects ON projects FOR ALL TO authenticated
  USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'organisation'
  ) WITH CHECK (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'organisation'
  );

-- Stakeholder: view allocated activities and submit daily updates
CREATE POLICY stakeholder_daily_activities ON daily_activity_updates FOR ALL TO authenticated
  USING (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  ) WITH CHECK (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  );

CREATE POLICY stakeholder_bills_access ON stakeholder_bills FOR ALL TO authenticated
  USING (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  ) WITH CHECK (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  );

-- Organisation Employee: daily activities and attendance
CREATE POLICY employee_attendance ON daily_attendance FOR ALL TO authenticated
  USING (
    recorded_by = auth.uid()
    AND get_user_role() = 'organisation_employee'
  ) WITH CHECK (
    recorded_by = auth.uid()
    AND get_user_role() = 'organisation_employee'
  );

CREATE POLICY employee_daily_activities ON daily_activity_updates FOR ALL TO authenticated
  USING (
    submitted_by = auth.uid()
    AND get_user_role() = 'organisation_employee'
  ) WITH CHECK (
    submitted_by = auth.uid()
    AND get_user_role() = 'organisation_employee'
  );

-- Organisation employees can view their own employee record
CREATE POLICY employee_view_self ON organisation_employees FOR SELECT TO authenticated
  USING (
    id = (SELECT organisation_employee_id FROM users WHERE id = auth.uid())
    OR organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    OR is_admin()
  );
