-- Organisation users can read active stakeholders (nursery inward dropdown, etc.)
CREATE POLICY org_read_stakeholders ON stakeholders FOR SELECT TO authenticated
  USING (get_user_role() = 'organisation' AND is_active = true);
