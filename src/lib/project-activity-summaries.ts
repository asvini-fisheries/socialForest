import { entryAmount, entryQuantity, type DailyActivityMetricRow } from '@/lib/daily-activity-metrics';
import { buildProjectAreaTree } from '@/lib/project-areas-tree';
import type { ProjectArea } from '@/types/database';

export type AreaActivityLine = {
  activityName: string;
  quantity: number;
  amount: number;
};

export type AreaActivitySummary = {
  areaId: string | null;
  areaName: string;
  areaCode: string | null;
  level: number;
  lines: AreaActivityLine[];
  totalQuantity: number;
  totalAmount: number;
};

export type DailyActivityAreaRow = DailyActivityMetricRow & {
  project_area_id: string | null;
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

function addLine(
  store: Map<string, Map<string, { quantity: number; amount: number }>>,
  areaKey: string,
  activityName: string,
  quantity: number,
  amount: number
) {
  if (!store.has(areaKey)) store.set(areaKey, new Map());
  const activityMap = store.get(areaKey)!;
  const prev = activityMap.get(activityName) || { quantity: 0, amount: 0 };
  activityMap.set(activityName, {
    quantity: prev.quantity + quantity,
    amount: prev.amount + amount,
  });
}

function toSummary(
  areaKey: string,
  activityMap: Map<string, { quantity: number; amount: number }>,
  areaById: Map<string, ProjectArea>
): AreaActivitySummary {
  const area = areaKey === WHOLE_PROJECT_KEY ? null : areaById.get(areaKey);
  const lines = [...activityMap.entries()]
    .map(([activityName, values]) => ({
      activityName,
      quantity: values.quantity,
      amount: values.amount,
    }))
    .sort((a, b) => a.activityName.localeCompare(b.activityName));

  return {
    areaId: area?.id ?? null,
    areaName: area?.name ?? 'Whole project',
    areaCode: area?.code ?? null,
    level: area?.level ?? 0,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    totalAmount: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}

/** Roll activity totals up to parent areas (for tree / cluster views). */
export function buildRolledUpSummariesByArea(
  areas: ProjectArea[],
  entries: DailyActivityAreaRow[]
): Map<string, AreaActivitySummary> {
  const parentById = new Map(areas.map((a) => [a.id, a.parent_area_id]));
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const store = new Map<string, Map<string, { quantity: number; amount: number }>>();

  for (const entry of entries) {
    const activityName = entry.project_activity?.activity?.name || 'Other';
    const quantity = entryQuantity(entry);
    const amount = entryAmount(entry);

    if (!entry.project_area_id) {
      addLine(store, WHOLE_PROJECT_KEY, activityName, quantity, amount);
      continue;
    }

    for (const areaId of getAncestorIds(entry.project_area_id, parentById)) {
      addLine(store, areaId, activityName, quantity, amount);
    }
  }

  const result = new Map<string, AreaActivitySummary>();
  for (const [key, activityMap] of store) {
    result.set(key, toSummary(key, activityMap, areaById));
  }
  return result;
}

/** Direct summaries at the area where each entry was recorded. */
export function buildDirectSummariesByArea(
  areas: ProjectArea[],
  entries: DailyActivityAreaRow[]
): AreaActivitySummary[] {
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const store = new Map<string, Map<string, { quantity: number; amount: number }>>();

  for (const entry of entries) {
    const activityName = entry.project_activity?.activity?.name || 'Other';
    const key = bucketKey(entry.project_area_id);
    addLine(store, key, activityName, entryQuantity(entry), entryAmount(entry));
  }

  const summaries = [...store.entries()].map(([key, activityMap]) =>
    toSummary(key, activityMap, areaById)
  );

  const treeOrder = flattenAreasInTreeOrder(areas);
  const orderIndex = new Map(treeOrder.map((id, idx) => [id, idx]));

  return summaries.sort((a, b) => {
    const keyA = bucketKey(a.areaId);
    const keyB = bucketKey(b.areaId);
    const orderA = orderIndex.get(keyA) ?? 9999;
    const orderB = orderIndex.get(keyB) ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    return a.areaName.localeCompare(b.areaName);
  });
}

function flattenAreasInTreeOrder(areas: ProjectArea[]): string[] {
  const ids: string[] = [WHOLE_PROJECT_KEY];
  const walk = (nodes: ProjectArea[]) => {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(buildProjectAreaTree(areas));
  return ids;
}

export function getAreaSummaryKey(areaId: string | null): string {
  return bucketKey(areaId);
}
