-- Admin full CRUD on remaining master tables

CREATE POLICY admin_all_activities ON activities FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_resources ON resources_materials FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_stakeholder_categories ON stakeholder_categories FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_org_contacts ON organisation_contacts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_org_certificates ON organisation_certificates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_org_employees ON organisation_employees FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_stakeholder_resources ON stakeholder_resources FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_stakeholder_access ON stakeholder_category_access_rights FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_all_stakeholder_rates ON stakeholder_supply_rates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin read all master rows (including inactive)
CREATE POLICY admin_read_all_years ON years FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_designations ON designations FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_certificates ON certificates FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_activities ON activities FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_resources ON resources_materials FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_csr ON csr_partners FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_orgs ON organisations FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY admin_read_all_stakeholders ON stakeholders FOR SELECT TO authenticated USING (is_admin());
