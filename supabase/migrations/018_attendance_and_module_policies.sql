-- Attendance RLS for organisation users and admins; module read/write for organisation projects

-- Daily attendance: admin + organisation (organisation_employee policy already exists)
CREATE POLICY admin_all_daily_attendance ON daily_attendance FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_daily_attendance ON daily_attendance FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    AND project_id IN (SELECT get_user_project_ids())
  );

-- Organisation project-scoped access to financial and operational modules
CREATE POLICY admin_all_stakeholder_bills ON stakeholder_bills FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_stakeholder_bills ON stakeholder_bills FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY admin_all_contractor_invoices ON contractor_invoices FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_contractor_invoices ON contractor_invoices FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY admin_all_payments ON payments_to_stakeholders FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_payments ON payments_to_stakeholders FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY admin_all_contractor_expenses ON contractor_expenses FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_contractor_expenses ON contractor_expenses FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY admin_all_tree_census ON tree_census_updates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_tree_census ON tree_census_updates FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY admin_all_nursery_inwards ON nursery_inwards FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_nursery_inwards ON nursery_inwards FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY admin_all_nursery_issues ON nursery_issues FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_nursery_issues ON nursery_issues FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

-- Stakeholder read access for invoices/expenses (bills policy already exists)
CREATE POLICY stakeholder_invoices_access ON contractor_invoices FOR ALL TO authenticated
  USING (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  ) WITH CHECK (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  );

CREATE POLICY stakeholder_expenses_access ON contractor_expenses FOR ALL TO authenticated
  USING (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  ) WITH CHECK (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  );

CREATE POLICY stakeholder_nursery_inwards ON nursery_inwards FOR ALL TO authenticated
  USING (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  ) WITH CHECK (
    stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    AND get_user_role() = 'stakeholder'
  );
