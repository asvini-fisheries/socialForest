-- Remaining masters: admin RLS + image attachments

DROP POLICY IF EXISTS admin_all_activity_resource_req ON activity_resource_requirements;
CREATE POLICY admin_all_activity_resource_req ON activity_resource_requirements FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_all_activity_contractor_alloc ON activity_contractor_allocations;
CREATE POLICY admin_all_activity_contractor_alloc ON activity_contractor_allocations FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_all_work_contracts ON work_contracts;
CREATE POLICY admin_all_work_contracts ON work_contracts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_all_work_contract_items ON work_contract_items;
CREATE POLICY admin_all_work_contract_items ON work_contract_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE stakeholder_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholder_resources ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholder_supply_rates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholder_category_access_rights ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE organisation_contacts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE organisation_certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE organisation_employees ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE activity_resource_requirements ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE activity_contractor_allocations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE work_contracts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE work_contract_items ADD COLUMN IF NOT EXISTS image_url TEXT;
