import { ACTIVITY_SELECT, getServiceClient } from '@/lib/daily-activities-api';
import {
  activityBillAmount,
  activityBillDescription,
  activityBillQuantity,
  type BillableActivity,
} from '@/lib/stakeholder-bills-utils';

export type UnbilledActivityRow = {
  id: string;
  activity_date: string;
  stakeholder_id: string;
  stakeholder_name: string;
  stakeholder_code: string | null;
  activity_name: string;
  project_area_name: string;
  quantity: number;
  amount: number;
  description: string;
};

export async function fetchUnbilledActivities(
  projectId: string,
  periodFrom?: string,
  periodTo?: string,
  stakeholderIds?: string[]
): Promise<BillableActivity[]> {
  const service = getServiceClient();

  let query = service
    .from('daily_activity_updates')
    .select(ACTIVITY_SELECT)
    .eq('project_id', projectId)
    .order('activity_date', { ascending: false });

  if (periodFrom) query = query.gte('activity_date', periodFrom);
  if (periodTo) query = query.lte('activity_date', periodTo);

  const { data: activities, error } = await query;
  if (error) throw new Error(error.message);

  const activityRows = (activities || []) as BillableActivity[];
  if (!activityRows.length) return [];

  const activityIds = activityRows.map((a) => a.id);
  const { data: billedItems, error: billedError } = await service
    .from('stakeholder_bill_items')
    .select('daily_activity_id')
    .in('daily_activity_id', activityIds);

  if (billedError) throw new Error(billedError.message);

  const billedIds = new Set(
    (billedItems || []).map((row) => row.daily_activity_id).filter(Boolean) as string[]
  );

  let unbilled = activityRows.filter((row) => !billedIds.has(row.id));

  if (stakeholderIds?.length) {
    const allowed = new Set(stakeholderIds);
    unbilled = unbilled.filter((row) => allowed.has(row.stakeholder_id));
  }

  return unbilled;
}

export function toUnbilledActivityRows(activities: BillableActivity[]): UnbilledActivityRow[] {
  return activities.map((activity) => ({
    id: activity.id,
    activity_date: activity.activity_date,
    stakeholder_id: activity.stakeholder_id,
    stakeholder_name: activity.stakeholder?.name || '',
    stakeholder_code: activity.stakeholder?.code || null,
    activity_name: activity.project_activity?.activity?.name || 'Activity',
    project_area_name: activity.project_area?.name || '',
    quantity: activityBillQuantity(activity),
    amount: activityBillAmount(activity),
    description: activityBillDescription(activity),
  }));
}
