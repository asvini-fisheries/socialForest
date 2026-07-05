-- Project area + activity budgets with resource line items (planned vs daily activity actuals)

CREATE TABLE project_area_activity_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_area_id UUID REFERENCES project_areas(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id),
  planned_quantity DECIMAL(12,2),
  remarks TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_project_area_activity_budgets_whole
  ON project_area_activity_budgets(project_id, activity_id)
  WHERE project_area_id IS NULL;

CREATE UNIQUE INDEX idx_project_area_activity_budgets_area
  ON project_area_activity_budgets(project_id, project_area_id, activity_id)
  WHERE project_area_id IS NOT NULL;

CREATE INDEX idx_project_area_activity_budgets_project
  ON project_area_activity_budgets(project_id);

CREATE TABLE project_area_activity_budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES project_area_activity_budgets(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  planned_quantity DECIMAL(12,2) NOT NULL,
  unit_rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (budget_id, resource_id)
);

CREATE INDEX idx_project_area_activity_budget_items_budget
  ON project_area_activity_budget_items(budget_id);

ALTER TABLE project_area_activity_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_area_activity_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_project_area_activity_budgets ON project_area_activity_budgets FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_project_area_activity_budgets ON project_area_activity_budgets FOR ALL TO authenticated
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

CREATE POLICY project_area_activity_budgets_read ON project_area_activity_budgets FOR SELECT TO authenticated
  USING (project_id IN (SELECT get_user_project_ids()));

CREATE POLICY admin_all_project_area_activity_budget_items ON project_area_activity_budget_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_project_area_activity_budget_items ON project_area_activity_budget_items FOR ALL TO authenticated
  USING (
    budget_id IN (
      SELECT b.id FROM project_area_activity_budgets b
      JOIN projects p ON p.id = b.project_id
      JOIN users u ON u.id = auth.uid()
      WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
    )
  ) WITH CHECK (
    budget_id IN (
      SELECT b.id FROM project_area_activity_budgets b
      JOIN projects p ON p.id = b.project_id
      JOIN users u ON u.id = auth.uid()
      WHERE u.role = 'organisation' AND p.organisation_id = u.organisation_id
    )
  );

CREATE POLICY project_area_activity_budget_items_read ON project_area_activity_budget_items FOR SELECT TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM project_area_activity_budgets
      WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON project_area_activity_budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_area_activity_budget_items TO authenticated;

CREATE TRIGGER project_area_activity_budgets_updated_at
  BEFORE UPDATE ON project_area_activity_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
