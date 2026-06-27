-- Project masters: admin RLS + image attachments

DROP POLICY IF EXISTS admin_all_project_areas ON project_areas;
CREATE POLICY admin_all_project_areas ON project_areas FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_all_project_user_access ON project_user_access;
CREATE POLICY admin_all_project_user_access ON project_user_access FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE project_areas ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE project_activities ADD COLUMN IF NOT EXISTS image_url TEXT;
