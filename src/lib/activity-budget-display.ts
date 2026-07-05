import { buildProjectAreaTree } from '@/lib/project-areas-tree';
import { formatAreaRef } from '@/lib/master-display';
import type { ProjectArea } from '@/types/database';

export type ActivityBudgetListRow = {
  id: string;
  project_area_id: string | null;
  activity_id: string;
  planned_quantity: number | null;
  remarks: string | null;
  activity?: { id?: string; name?: string; code?: string | null } | null;
  project_area?: {
    id?: string;
    name?: string;
    code?: string | null;
    level?: number;
    parent_area_id?: string | null;
    parent_area?: { name?: string; code?: string | null } | null;
  } | null;
  resources?: {
    resource_id: string;
    planned_quantity: number;
    unit_rate: number | null;
    resource?: { name?: string } | null;
  }[];
};

export type ActivityBudgetFilters = {
  search: string;
  parentArea: string;
  projectArea: string;
  activity: string;
};

export const EMPTY_ACTIVITY_BUDGET_FILTERS: ActivityBudgetFilters = {
  search: '',
  parentArea: '',
  projectArea: '',
  activity: '',
};

const WHOLE_PROJECT_KEY = '__whole_project__';

export function budgetParentAreaText(row: ActivityBudgetListRow): string {
  if (!row.project_area_id) return '—';
  return formatAreaRef(row.project_area?.parent_area) || '—';
}

export function budgetProjectAreaText(row: ActivityBudgetListRow): string {
  if (!row.project_area_id) return 'Whole project';
  return formatAreaRef(row.project_area) || row.project_area?.name || '—';
}

export function budgetResourcesText(row: ActivityBudgetListRow): string {
  return (row.resources || [])
    .map((item) => `${item.resource?.name || 'Resource'}: ${item.planned_quantity}`)
    .join('; ');
}

export function buildAreaSortIndex(areas: ProjectArea[]): Map<string, number> {
  const order = new Map<string, number>();
  order.set(WHOLE_PROJECT_KEY, 0);

  const walk = (nodes: ProjectArea[], depth: number) => {
    for (const node of nodes) {
      order.set(node.id, order.size);
      if (node.children?.length) walk(node.children, depth + 1);
    }
  };

  walk(buildProjectAreaTree(areas), 1);
  return order;
}

export function sortActivityBudgetRows(
  rows: ActivityBudgetListRow[],
  areaOrder: Map<string, number>
): ActivityBudgetListRow[] {
  return [...rows].sort((a, b) => {
    const keyA = a.project_area_id ?? WHOLE_PROJECT_KEY;
    const keyB = b.project_area_id ?? WHOLE_PROJECT_KEY;
    const orderA = areaOrder.get(keyA) ?? 9999;
    const orderB = areaOrder.get(keyB) ?? 9999;
    if (orderA !== orderB) return orderA - orderB;

    const areaCmp = budgetProjectAreaText(a).localeCompare(budgetProjectAreaText(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (areaCmp !== 0) return areaCmp;

    return (a.activity?.name || '').localeCompare(b.activity?.name || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

export function filterActivityBudgetRows(
  rows: ActivityBudgetListRow[],
  filters: ActivityBudgetFilters
): ActivityBudgetListRow[] {
  const searchQ = filters.search.trim().toLowerCase();
  const parentQ = filters.parentArea.trim().toLowerCase();
  const areaQ = filters.projectArea.trim().toLowerCase();
  const activityQ = filters.activity.trim().toLowerCase();

  return rows.filter((row) => {
    if (parentQ) {
      const parentText = budgetParentAreaText(row).toLowerCase();
      if (!parentText.includes(parentQ)) return false;
    }

    if (areaQ) {
      const areaText = budgetProjectAreaText(row).toLowerCase();
      if (!areaText.includes(areaQ)) return false;
    }

    if (activityQ) {
      const activityName = row.activity?.name?.toLowerCase() || '';
      if (!activityName.includes(activityQ)) return false;
    }

    if (searchQ) {
      const haystack = [
        budgetParentAreaText(row),
        budgetProjectAreaText(row),
        row.activity?.name || '',
        row.activity?.code || '',
        budgetResourcesText(row),
        row.remarks || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchQ)) return false;
    }

    return true;
  });
}

export function hasActiveBudgetFilters(filters: ActivityBudgetFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '');
}
