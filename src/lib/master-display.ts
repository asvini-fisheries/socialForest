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
