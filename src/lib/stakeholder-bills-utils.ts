import { entryAmount, type DailyActivityMetricRow } from '@/lib/daily-activity-metrics';

export type BillableActivity = {
  id: string;
  project_id: string;
  stakeholder_id: string;
  activity_date: string;
  quantity_completed?: number | null;
  project_activity?: { activity?: { name?: string } | null } | null;
  project_area?: { name?: string; code?: string | null } | null;
  stakeholder?: { name?: string; code?: string | null } | null;
  resources_used?: {
    resource_id: string;
    quantity_used: number;
    unit_rate: number | null;
    resource?: { name?: string } | null;
  }[];
};

export function activityBillAmount(activity: BillableActivity): number {
  return entryAmount(activity as DailyActivityMetricRow);
}

export function activityBillQuantity(activity: BillableActivity): number {
  const resourceQty = (activity.resources_used || []).reduce(
    (sum, row) => sum + (Number(row.quantity_used) || 0),
    0
  );
  if (resourceQty > 0) return resourceQty;
  return Number(activity.quantity_completed) || 0;
}

export function activityBillDescription(activity: BillableActivity): string {
  const activityName = activity.project_activity?.activity?.name || 'Daily activity';
  const area = activity.project_area?.name;
  const date = activity.activity_date;
  const resourceText = (activity.resources_used || [])
    .map((r) => {
      const name = r.resource?.name || 'Resource';
      return `${name} × ${r.quantity_used}`;
    })
    .join(', ');

  const parts = [activityName];
  if (area) parts.push(area);
  parts.push(date);
  if (resourceText) parts.push(resourceText);
  return parts.join(' — ');
}

export function activityBillUnitRate(activity: BillableActivity): number {
  const qty = activityBillQuantity(activity);
  const amount = activityBillAmount(activity);
  if (qty <= 0) return 0;
  return Math.round((amount / qty) * 100) / 100;
}

export function formatBillNumber(periodFrom: string, periodTo: string, sequence: number): string {
  const from = periodFrom.replace(/-/g, '');
  const to = periodTo.replace(/-/g, '');
  return `SB-${from}-${to}-${String(sequence).padStart(3, '0')}`;
}

export function groupActivitiesByStakeholder(
  activities: BillableActivity[]
): Map<string, BillableActivity[]> {
  const groups = new Map<string, BillableActivity[]>();
  for (const activity of activities) {
    const list = groups.get(activity.stakeholder_id) || [];
    list.push(activity);
    groups.set(activity.stakeholder_id, list);
  }
  return groups;
}
