export type BudgetResourceRow = {
  planned_quantity: number;
  unit_rate: number | null;
  resource?: { name?: string; is_tree_species?: boolean | null } | null;
};

export type ActivityBudgetMetricRow = {
  planned_quantity?: number | null;
  resources?: BudgetResourceRow[] | null;
};

export function budgetResourceAmount(row: BudgetResourceRow): number {
  const qty = Number(row.planned_quantity) || 0;
  const rate = Number(row.unit_rate) || 0;
  return qty * rate;
}

export function budgetAmount(entry: ActivityBudgetMetricRow): number {
  const fromResources = (entry.resources || []).reduce((sum, row) => sum + budgetResourceAmount(row), 0);
  if (fromResources > 0) return fromResources;
  return 0;
}

export function budgetTreeSpeciesQuantity(entry: ActivityBudgetMetricRow): number {
  return (entry.resources || []).reduce((sum, row) => {
    if (!row.resource?.is_tree_species) return sum;
    return sum + (Number(row.planned_quantity) || 0);
  }, 0);
}

export function budgetQuantity(entry: ActivityBudgetMetricRow): number {
  if (entry.planned_quantity != null && Number(entry.planned_quantity) > 0) {
    return Number(entry.planned_quantity);
  }
  return (entry.resources || []).reduce((sum, row) => sum + (Number(row.planned_quantity) || 0), 0);
}

export function sumBudgetAmount(entries: ActivityBudgetMetricRow[]): number {
  return entries.reduce((sum, entry) => sum + budgetAmount(entry), 0);
}
