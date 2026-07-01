export type NurseryLineInput = {
  resource_id: string;
  quantity: number;
  unit_rate: number;
};

export function computeLineAmount(quantity: number, unitRate: number): number {
  return Math.round(quantity * unitRate * 100) / 100;
}

export function computeTotalAmount(lines: NurseryLineInput[]): number {
  return lines.reduce((sum, line) => sum + computeLineAmount(line.quantity, line.unit_rate), 0);
}

export function normalizeLines(lines: NurseryLineInput[]): NurseryLineInput[] {
  return lines
    .filter((l) => l.resource_id && l.quantity > 0)
    .map((l) => ({
      resource_id: l.resource_id,
      quantity: Math.floor(Number(l.quantity)),
      unit_rate: Number(l.unit_rate) || 0,
    }));
}

export function normalizeSaplingLines(
  lines: { resource_id: string; quantity: number }[]
): { resource_id: string; quantity: number }[] {
  return lines
    .filter((l) => l.resource_id && l.quantity > 0)
    .map((l) => ({
      resource_id: l.resource_id,
      quantity: Math.floor(Number(l.quantity)),
    }));
}

export function totalSaplingQuantity(lines: { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
