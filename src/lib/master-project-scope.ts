export type ProjectScope =
  | { type: 'none' }
  | { type: 'id' }
  | { type: 'field'; field: string }
  | { type: 'optionalField'; field: string }
  | { type: 'nested'; getProjectId: (row: Record<string, unknown>) => string | null };

const NESTED_PROJECT_ACTIVITY = (row: Record<string, unknown>) => {
  const pa = row.project_activity as { project_id?: string; project?: { id?: string } } | null;
  return pa?.project_id ?? pa?.project?.id ?? null;
};

const NESTED_WORK_CONTRACT = (row: Record<string, unknown>) => {
  const wc = row.contract as { project_id?: string; project?: { id?: string } } | null;
  return wc?.project_id ?? wc?.project?.id ?? null;
};

const SCOPES: Record<string, ProjectScope> = {
  projects: { type: 'id' },
  project_areas: { type: 'field', field: 'project_id' },
  project_activities: { type: 'field', field: 'project_id' },
  project_user_access: { type: 'field', field: 'project_id' },
  work_contracts: { type: 'field', field: 'project_id' },
  stakeholder_supply_rates: { type: 'optionalField', field: 'project_id' },
  activity_resource_requirements: { type: 'nested', getProjectId: NESTED_PROJECT_ACTIVITY },
  activity_contractor_allocations: { type: 'nested', getProjectId: NESTED_PROJECT_ACTIVITY },
  work_contract_items: { type: 'nested', getProjectId: NESTED_WORK_CONTRACT },
};

export function getMasterProjectScope(table: string): ProjectScope {
  return SCOPES[table] ?? { type: 'none' };
}

export function filterRowsByProject(
  rows: Record<string, unknown>[],
  table: string,
  projectId: string
): Record<string, unknown>[] {
  const scope = getMasterProjectScope(table);
  if (scope.type === 'none' || !projectId) return rows;

  if (scope.type === 'id') {
    return rows.filter((r) => r.id === projectId);
  }
  if (scope.type === 'field') {
    return rows.filter((r) => r[scope.field] === projectId);
  }
  if (scope.type === 'optionalField') {
    return rows.filter((r) => !r[scope.field] || r[scope.field] === projectId);
  }
  if (scope.type === 'nested') {
    return rows.filter((r) => scope.getProjectId(r) === projectId);
  }
  return rows;
}

export function apiProjectFilterColumn(table: string): string | null {
  const scope = getMasterProjectScope(table);
  if (scope.type === 'field') return scope.field;
  if (scope.type === 'id') return 'id';
  return null;
}
