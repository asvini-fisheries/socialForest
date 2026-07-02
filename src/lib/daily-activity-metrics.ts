export type DailyActivityResourceRow = {
  quantity_used: number;
  unit_rate: number | null;
  resource?: { name?: string; is_tree_species?: boolean | null } | null;
};

export type DailyActivityMetricRow = {
  quantity_completed?: number | null;
  project_activity?: {
    activity?: { name?: string; code?: string | null } | null;
  } | null;
  resources_used?: DailyActivityResourceRow[] | null;
};

export function isTreePlantationActivity(entry: DailyActivityMetricRow): boolean {
  const name = entry.project_activity?.activity?.name || '';
  const code = entry.project_activity?.activity?.code || '';
  return name === 'Tree Plantation' || code === 'TREE-PLANT';
}

/** Sum tree-species resource quantities on Tree Plantation activities only */
export function treePlantationSpeciesQuantity(entry: DailyActivityMetricRow): number {
  if (!isTreePlantationActivity(entry)) return 0;
  return (entry.resources_used || []).reduce((sum, row) => {
    if (!row.resource?.is_tree_species) return sum;
    return sum + (Number(row.quantity_used) || 0);
  }, 0);
}

/** Sum quantities for all resources marked as tree species */
export function treeSpeciesQuantity(entry: DailyActivityMetricRow): number {
  return (entry.resources_used || []).reduce((sum, row) => {
    if (!row.resource?.is_tree_species) return sum;
    return sum + (Number(row.quantity_used) || 0);
  }, 0);
}

export function sumTreePlantationSpeciesQuantity(entries: DailyActivityMetricRow[]): number {
  return entries.reduce((sum, entry) => sum + treePlantationSpeciesQuantity(entry), 0);
}

export function entryQuantity(entry: DailyActivityMetricRow): number {
  return Number(entry.quantity_completed) || 0;
}

export function entryAmount(entry: DailyActivityMetricRow): number {
  return (entry.resources_used || []).reduce((sum, row) => {
    const qty = Number(row.quantity_used) || 0;
    const rate = Number(row.unit_rate) || 0;
    return sum + qty * rate;
  }, 0);
}

export function sumActivityQuantity(entries: DailyActivityMetricRow[]): number {
  return entries.reduce((sum, entry) => sum + entryQuantity(entry), 0);
}

export function sumActivityAmount(entries: DailyActivityMetricRow[]): number {
  return entries.reduce((sum, entry) => sum + entryAmount(entry), 0);
}
