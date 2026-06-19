-- Idempotent RLS fix for daily activities + project_activities
-- Safe to re-run

DROP POLICY IF EXISTS admin_all_project_activities ON project_activities;
CREATE POLICY admin_all_project_activities ON project_activities FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS project_activities_read ON project_activities;
CREATE POLICY project_activities_read ON project_activities FOR SELECT TO authenticated
  USING (project_id IN (SELECT get_user_project_ids()));

DROP POLICY IF EXISTS org_project_activities ON project_activities;
CREATE POLICY org_project_activities ON project_activities FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.id = auth.uid()
      WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
    )
  ) WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.id = auth.uid()
      WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
    )
  );

DROP POLICY IF EXISTS admin_all_daily_activities ON daily_activity_updates;
CREATE POLICY admin_all_daily_activities ON daily_activity_updates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS org_daily_activities ON daily_activity_updates;
CREATE POLICY org_daily_activities ON daily_activity_updates FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.id = auth.uid()
      WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
    )
  ) WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.id = auth.uid()
      WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
    )
  );

DROP POLICY IF EXISTS project_daily_activities_read ON daily_activity_updates;
CREATE POLICY project_daily_activities_read ON daily_activity_updates FOR SELECT TO authenticated
  USING (project_id IN (SELECT get_user_project_ids()));

DROP POLICY IF EXISTS admin_all_daily_activity_images ON daily_activity_images;
CREATE POLICY admin_all_daily_activity_images ON daily_activity_images FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_all_daily_activity_resources ON daily_activity_resources_used;
CREATE POLICY admin_all_daily_activity_resources ON daily_activity_resources_used FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- SECURITY DEFINER helper (works even before RLS policies)
CREATE OR REPLACE FUNCTION get_or_create_project_activity(
  p_project_id UUID,
  p_activity_id UUID,
  p_project_area_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM project_activities
  WHERE project_id = p_project_id AND activity_id = p_activity_id
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO project_activities (project_id, activity_id, project_area_id)
    VALUES (p_project_id, p_activity_id, p_project_area_id)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_project_activity(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_project_activity(UUID, UUID, UUID) TO service_role;
