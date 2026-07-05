-- Allow the same resource on multiple lines within one activity budget
-- (e.g. separate HDPE pipe segments with different quantities)

ALTER TABLE project_area_activity_budget_items
  DROP CONSTRAINT IF EXISTS project_area_activity_budget_items_budget_id_resource_id_key;
