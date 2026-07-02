import {
  entryAmount,
  entryQuantity,
  treeSpeciesQuantity,
  type DailyActivityMetricRow,
} from '@/lib/daily-activity-metrics';
import { buildProjectAreaTree } from '@/lib/project-areas-tree';
import type { ProjectArea } from '@/types/database';

export type AreaActivityLine = {
  activityName: string;
  quantity: number;
  saplings: number;
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
  activity_date?: string;
  project_area?: { name?: string; code?: string | null } | null;
};

export type ActivityDateLine = {
  date: string;
  quantity: number;
  saplings: number;
  amount: number;
  projectAreaName: string | null;
};

export type ActivityTreeNode = {
  activityName: string;
  quantity: number;
  saplings: number;
  amount: number;
  dates: ActivityDateLine[];
};

export type ClusterActivityTree = {
  areaId: string | null;
  areaName: string;
  areaCode: string | null;
  quantity: number;
  saplings: number;
  amount: number;
  activities: ActivityTreeNode[];
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

function toSummary(
  areaKey: string,
  activityMap: Map<string, { quantity: number; saplings: number; amount: number }>,
  areaById: Map<string, ProjectArea>
): AreaActivitySummary {
  const area = areaKey === WHOLE_PROJECT_KEY ? null : areaById.get(areaKey);
  const lines = [...activityMap.entries()]
    .map(([activityName, values]) => ({
      activityName,
      quantity: values.quantity,
      saplings: values.saplings,
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
  const store = new Map<string, Map<string, { quantity: number; saplings: number; amount: number }>>();

  for (const entry of entries) {
    const activityName = entry.project_activity?.activity?.name || 'Other';
    const quantity = entryQuantity(entry);
    const saplings = treeSpeciesQuantity(entry);
    const amount = entryAmount(entry);

    if (!entry.project_area_id) {
      addLine(store, WHOLE_PROJECT_KEY, activityName, quantity, saplings, amount);
      continue;
    }

    for (const areaId of getAncestorIds(entry.project_area_id, parentById)) {
      addLine(store, areaId, activityName, quantity, saplings, amount);
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
  const store = new Map<string, Map<string, { quantity: number; saplings: number; amount: number }>>();

  for (const entry of entries) {
    const activityName = entry.project_activity?.activity?.name || 'Other';
    const key = bucketKey(entry.project_area_id);
    addLine(
      store,
      key,
      activityName,
      entryQuantity(entry),
      treeSpeciesQuantity(entry),
      entryAmount(entry)
    );
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

function getClusterRootId(
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

function sortByCode(a: ProjectArea, b: ProjectArea) {
  const codeA = (a.code || a.name || '').toLowerCase();
  const codeB = (b.code || b.name || '').toLowerCase();
  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
}

/** Cluster → activity → date tree for Activities by Project Area. */
export function buildActivityTreeByCluster(
  areas: ProjectArea[],
  entries: DailyActivityAreaRow[]
): ClusterActivityTree[] {
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const parentById = new Map(areas.map((a) => [a.id, a.parent_area_id]));

  type DateBucket = { quantity: number; saplings: number; amount: number; areaNames: Set<string> };
  type ActivityBucket = Map<string, Map<string, DateBucket>>;
  const clusterStore = new Map<string, ActivityBucket>();

  const clusterKey = (areaId: string | null) => bucketKey(areaId);

  for (const entry of entries) {
    const rootId = getClusterRootId(entry.project_area_id, areaById, parentById);
    const cKey = clusterKey(rootId);
    const activityName = entry.project_activity?.activity?.name || 'Other';
    const date = entry.activity_date || '';
    const qty = entryQuantity(entry);
    const saplings = treeSpeciesQuantity(entry);
    const amt = entryAmount(entry);
    const areaName =
      entry.project_area?.name ||
      (entry.project_area_id ? areaById.get(entry.project_area_id)?.name : null) ||
      null;

    if (!clusterStore.has(cKey)) clusterStore.set(cKey, new Map());
    const actMap = clusterStore.get(cKey)!;
    if (!actMap.has(activityName)) actMap.set(activityName, new Map());
    const dateMap = actMap.get(activityName)!;

    const prev = dateMap.get(date) || { quantity: 0, saplings: 0, amount: 0, areaNames: new Set<string>() };
    if (areaName) prev.areaNames.add(areaName);
    dateMap.set(date, {
      quantity: prev.quantity + qty,
      saplings: prev.saplings + saplings,
      amount: prev.amount + amt,
      areaNames: prev.areaNames,
    });
  }

  const trees: ClusterActivityTree[] = [];

  for (const [cKey, actMap] of clusterStore) {
    const area = cKey === WHOLE_PROJECT_KEY ? null : areaById.get(cKey);
    const activities: ActivityTreeNode[] = [];

    for (const [activityName, dateMap] of actMap) {
      const dates: ActivityDateLine[] = [...dateMap.entries()]
        .map(([date, bucket]) => ({
          date,
          quantity: bucket.quantity,
          saplings: bucket.saplings,
          amount: bucket.amount,
          projectAreaName:
            bucket.areaNames.size === 0
              ? null
              : bucket.areaNames.size === 1
                ? [...bucket.areaNames][0]
                : [...bucket.areaNames].sort().join(', '),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      activities.push({
        activityName,
        quantity: dates.reduce((s, d) => s + d.quantity, 0),
        saplings: dates.reduce((s, d) => s + d.saplings, 0),
        amount: dates.reduce((s, d) => s + d.amount, 0),
        dates,
      });
    }

    activities.sort((a, b) => a.activityName.localeCompare(b.activityName));

    trees.push({
      areaId: area?.id ?? null,
      areaName: area?.name ?? 'Whole project',
      areaCode: area?.code ?? null,
      quantity: activities.reduce((s, a) => s + a.quantity, 0),
      saplings: activities.reduce((s, a) => s + a.saplings, 0),
      amount: activities.reduce((s, a) => s + a.amount, 0),
      activities,
    });
  }

  const level1Order = buildProjectAreaTree(areas.filter((a) => a.level === 1)).sort(sortByCode);
  const orderIndex = new Map<string, number>();
  orderIndex.set(WHOLE_PROJECT_KEY, 9999);
  level1Order.forEach((a, idx) => orderIndex.set(a.id, idx));

  return trees
    .filter((t) => t.activities.length > 0)
    .sort((a, b) => {
      const orderA = orderIndex.get(bucketKey(a.areaId)) ?? 9998;
      const orderB = orderIndex.get(bucketKey(b.areaId)) ?? 9998;
      if (orderA !== orderB) return orderA - orderB;
      return a.areaName.localeCompare(b.areaName);
    });
}
