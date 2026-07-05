import {
  budgetAmount,
  budgetQuantity,
  budgetTreeSpeciesQuantity,
  type ActivityBudgetMetricRow,
} from '@/lib/activity-budget-metrics';
import type { AreaActivitySummary } from '@/lib/project-activity-summaries';
import type { ProjectArea } from '@/types/database';

export type ActivityBudgetRow = ActivityBudgetMetricRow & {
  id: string;
  project_area_id: string | null;
  activity_id: string;
  activity?: { id?: string; name?: string; code?: string | null } | null;
  project_area?: { id?: string; name?: string; code?: string | null } | null;
  resources?: {
    id: string;
    resource_id: string;
    planned_quantity: number;
    unit_rate: number | null;
    resource?: { name?: string; is_tree_species?: boolean | null } | null;
  }[];
};

export type BudgetActivityLine = {
  activityName: string;
  plannedQuantity: number;
  plannedSaplings: number;
  plannedAmount: number;
};

export type BudgetAreaSummary = {
  areaId: string | null;
  areaName: string;
  areaCode: string | null;
  level: number;
  lines: BudgetActivityLine[];
  totalPlannedQuantity: number;
  totalPlannedSaplings: number;
  totalPlannedAmount: number;
};

const WHOLE_PROJECT_KEY = '__whole_project__';

function bucketKey(areaId: string | null): string {
  return areaId ?? WHOLE_PROJECT_KEY;
}

function getAncestorIds(areaId: string | null, parentById: Map<string, string | null>): string[] {
  const ids: string[] = [];
  if (areaId) ids.push(areaId);
  let current = areaId ? parentById.get(areaId) : null;
  while (current) {
    ids.push(current);
    current = parentById.get(current) ?? null;
  }
  return ids;
}

function addBudgetLine(
  store: Map<string, Map<string, { quantity: number; saplings: number; amount: number }>>,
  areaKey: string,
  activityName: string,
  quantity: number,
  saplings: number,
  amount: number
) {
  if (!store.has(areaKey)) store.set(areaKey, new Map());
  const activityMap = store.get(areaKey)!;
  const prev = activityMap.get(activityName) || { quantity: 0, saplings: 0, amount: 0 };
  activityMap.set(activityName, {
    quantity: prev.quantity + quantity,
    saplings: prev.saplings + saplings,
    amount: prev.amount + amount,
  });
}

function toBudgetSummary(
  areaKey: string,
  activityMap: Map<string, { quantity: number; saplings: number; amount: number }>,
  areaById: Map<string, ProjectArea>
): BudgetAreaSummary {
  const area = areaKey === WHOLE_PROJECT_KEY ? null : areaById.get(areaKey);
  const lines = [...activityMap.entries()]
    .map(([activityName, values]) => ({
      activityName,
      plannedQuantity: values.quantity,
      plannedSaplings: values.saplings,
      plannedAmount: values.amount,
    }))
    .sort((a, b) => a.activityName.localeCompare(b.activityName));

  return {
    areaId: area?.id ?? null,
    areaName: area?.name ?? 'Whole project',
    areaCode: area?.code ?? null,
    level: area?.level ?? 0,
    lines,
    totalPlannedQuantity: lines.reduce((sum, line) => sum + line.plannedQuantity, 0),
    totalPlannedSaplings: lines.reduce((sum, line) => sum + line.plannedSaplings, 0),
    totalPlannedAmount: lines.reduce((sum, line) => sum + line.plannedAmount, 0),
  };
}

/** Roll budget totals up to parent areas (mirrors actual activity rollups). */
export function buildRolledUpBudgetSummariesByArea(
  areas: ProjectArea[],
  budgets: ActivityBudgetRow[]
): Map<string, BudgetAreaSummary> {
  const parentById = new Map(areas.map((area) => [area.id, area.parent_area_id]));
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const store = new Map<string, Map<string, { quantity: number; saplings: number; amount: number }>>();

  for (const budget of budgets) {
    const activityName = budget.activity?.name || 'Other';
    const quantity = budgetQuantity(budget);
    const saplings = budgetTreeSpeciesQuantity(budget);
    const amount = budgetAmount(budget);

    if (!budget.project_area_id) {
      addBudgetLine(store, WHOLE_PROJECT_KEY, activityName, quantity, saplings, amount);
      continue;
    }

    for (const areaId of getAncestorIds(budget.project_area_id, parentById)) {
      addBudgetLine(store, areaId, activityName, quantity, saplings, amount);
    }
  }

  const result = new Map<string, BudgetAreaSummary>();
  for (const [key, activityMap] of store) {
    result.set(key, toBudgetSummary(key, activityMap, areaById));
  }
  return result;
}

export function sumProjectBudgetAmount(budgets: ActivityBudgetRow[]): number {
  return budgets.reduce((sum, budget) => sum + budgetAmount(budget), 0);
}

export type PlannedVsActualLine = {
  activityName: string;
  plannedQuantity: number;
  actualQuantity: number;
  plannedSaplings: number;
  actualSaplings: number;
  plannedAmount: number;
  actualAmount: number;
};

export function mergePlannedAndActualSummaries(
  planned?: AreaActivitySummary,
  actual?: AreaActivitySummary
): PlannedVsActualLine[] {
  const activityNames = new Set<string>();
  planned?.lines.forEach((line) => activityNames.add(line.activityName));
  actual?.lines.forEach((line) => activityNames.add(line.activityName));

  return [...activityNames]
    .sort((a, b) => a.localeCompare(b))
    .map((activityName) => {
      const plannedLine = planned?.lines.find((line) => line.activityName === activityName);
      const actualLine = actual?.lines.find((line) => line.activityName === activityName);
      return {
        activityName,
        plannedQuantity: plannedLine?.quantity || 0,
        actualQuantity: actualLine?.quantity || 0,
        plannedSaplings: plannedLine?.saplings || 0,
        actualSaplings: actualLine?.saplings || 0,
        plannedAmount: plannedLine?.amount || 0,
        actualAmount: actualLine?.amount || 0,
      };
    });
}

export function getBudgetSummaryKey(areaId: string | null): string {
  return bucketKey(areaId);
}

function clusterRootId(
  areaId: string | null,
  areaById: Map<string, ProjectArea>,
  parentById: Map<string, string | null>
): string | null {
  if (!areaId) return null;
  let current: string | null = areaId;
  while (current) {
    const area = areaById.get(current);
    if (!area || area.level === 1 || !area.parent_area_id) return current;
    current = area.parent_area_id;
  }
  return areaId;
}

export type PlannedClusterActivityTotals = {
  quantity: number;
  saplings: number;
  amount: number;
};

export function buildPlannedClusterActivityMap(
  areas: ProjectArea[],
  budgets: ActivityBudgetRow[]
): Map<string, PlannedClusterActivityTotals> {
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const parentById = new Map(areas.map((area) => [area.id, area.parent_area_id]));
  const map = new Map<string, PlannedClusterActivityTotals>();

  for (const budget of budgets) {
    const rootId = budget.project_area_id
      ? clusterRootId(budget.project_area_id, areaById, parentById)
      : null;
    const key = `${rootId ?? 'whole'}:${budget.activity?.name || 'Other'}`;
    const prev = map.get(key) || { quantity: 0, saplings: 0, amount: 0 };
    map.set(key, {
      quantity: prev.quantity + budgetQuantity(budget),
      saplings: prev.saplings + budgetTreeSpeciesQuantity(budget),
      amount: prev.amount + budgetAmount(budget),
    });
  }

  return map;
}

export function getPlannedClusterTotals(
  map: Map<string, PlannedClusterActivityTotals>,
  clusterAreaId: string | null
): PlannedClusterActivityTotals {
  const prefix = `${clusterAreaId ?? 'whole'}:`;
  let quantity = 0;
  let saplings = 0;
  let amount = 0;
  for (const [key, values] of map) {
    if (!key.startsWith(prefix)) continue;
    quantity += values.quantity;
    saplings += values.saplings;
    amount += values.amount;
  }
  return { quantity, saplings, amount };
}
