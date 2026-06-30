export type DailyActivityResourceRow = {
  quantity_used: number;
  unit_rate: number | null;
};

export type DailyActivityMetricRow = {
  quantity_completed?: number | null;
  project_activity?: { activity?: { name?: string } } | null;
  resources_used?: DailyActivityResourceRow[] | null;
};

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
