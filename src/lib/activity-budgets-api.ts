import { getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const BUDGET_SELECT = `
  id, project_id, project_area_id, activity_id, planned_quantity, remarks, is_active, created_at, updated_at,
  activity:activities(id, name, code),
  project_area:project_areas(id, name, code, level, parent_area_id),
  resources:project_area_activity_budget_items(
    id, resource_id, planned_quantity, unit_rate,
    resource:resources_materials(name, is_tree_species)
  )
`;

export { getServiceClient, requireProjectAccess };
