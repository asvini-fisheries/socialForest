-- RLS policies for daily activities (admin + organisation + related tables)

CREATE POLICY admin_all_project_activities ON project_activities FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY project_activities_read ON project_activities FOR SELECT TO authenticated
  USING (project_id IN (SELECT get_user_project_ids()));

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

CREATE POLICY admin_all_daily_activities ON daily_activity_updates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

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

CREATE POLICY project_daily_activities_read ON daily_activity_updates FOR SELECT TO authenticated
  USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY admin_all_daily_activity_images ON daily_activity_images FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY daily_activity_images_access ON daily_activity_images FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_activity_updates d
      WHERE d.id = daily_activity_id
        AND (
          is_admin()
          OR d.project_id IN (SELECT get_user_project_ids())
          OR d.stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_activity_updates d
      WHERE d.id = daily_activity_id
        AND (
          is_admin()
          OR d.project_id IN (
            SELECT p.id FROM projects p
            JOIN users u ON u.id = auth.uid()
            WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
          )
          OR d.stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
        )
    )
  );

CREATE POLICY admin_all_daily_activity_resources ON daily_activity_resources_used FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY daily_activity_resources_access ON daily_activity_resources_used FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_activity_updates d
      WHERE d.id = daily_activity_id
        AND (
          is_admin()
          OR d.project_id IN (SELECT get_user_project_ids())
          OR d.stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_activity_updates d
      WHERE d.id = daily_activity_id
        AND (
          is_admin()
          OR d.project_id IN (
            SELECT p.id FROM projects p
            JOIN users u ON u.id = auth.uid()
            WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
          )
          OR d.stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
        )
    )
  );
