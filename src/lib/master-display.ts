/** Format joined project/parent area reference for display and filtering */
export function formatAreaRef(ref: unknown): string {
  const row = ref as { name?: string; code?: string } | null | undefined;
  if (!row?.name) return '';
  return row.code ? `${row.name} (${row.code})` : row.name;
}

export function projectAreaProjectText(row: Record<string, unknown>): string {
  return formatAreaRef(row.project);
}

export function projectAreaParentText(row: Record<string, unknown>): string {
  return formatAreaRef(row.parent_area);
}

export function projectActivityProjectText(row: Record<string, unknown>): string {
  return formatAreaRef(row.project);
}

export function projectActivityActivityText(row: Record<string, unknown>): string {
  return formatAreaRef(row.activity);
}

export function projectActivityActivityKey(row: Record<string, unknown>): string {
  const activity = row.activity as { id?: string; name?: string } | null;
  return activity?.id ?? String(row.activity_id ?? activity?.name ?? '');
}

export function projectActivityAreaText(row: Record<string, unknown>): string {
  const area = row.project_area as { name?: string; code?: string } | null;
  if (!area?.name) return 'All areas';
  return formatAreaRef(area);
}

export function projectActivityAreaKey(row: Record<string, unknown>): string {
  if (!row.project_area_id) return '__all_areas__';
  const area = row.project_area as { id?: string } | null;
  return area?.id ?? String(row.project_area_id);
}

/** Build distinct multiselect options from loaded rows */
export function buildMasterFilterOptions(
  rows: Record<string, unknown>[],
  filter: { getValue: (row: Record<string, unknown>) => string; getKey?: (row: Record<string, unknown>) => string }
): { value: string; label: string }[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = filter.getKey?.(row) ?? filter.getValue(row);
    if (!key) continue;
    const label = filter.getValue(row) || key;
    map.set(key, label);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label }));
}
