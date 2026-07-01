import { NextRequest, NextResponse } from 'next/server';
import {
  BILL_LIST_SELECT,
  getServiceClient,
  requireProjectAccess,
} from '@/lib/stakeholder-bills-api';
import {
  activityBillAmount,
  activityBillDescription,
  activityBillQuantity,
  activityBillUnitRate,
  formatBillNumber,
  groupActivitiesByStakeholder,
} from '@/lib/stakeholder-bills-utils';
import {
  fetchUnbilledActivities,
  toUnbilledActivityRows,
} from '@/lib/stakeholder-bills-unbilled';

function buildPreview(periodFrom: string, periodTo: string, activities: Awaited<ReturnType<typeof fetchUnbilledActivities>>) {
  const groups = groupActivitiesByStakeholder(activities);
  const stakeholders = Array.from(groups.entries()).map(([stakeholderId, rows]) => ({
    stakeholder_id: stakeholderId,
    stakeholder_name: rows[0]?.stakeholder?.name || 'Stakeholder',
    activity_count: rows.length,
    total_amount: rows.reduce((sum, row) => sum + activityBillAmount(row), 0),
  }));

  return {
    period_from: periodFrom,
    period_to: periodTo,
    total_activities: activities.length,
    total_amount: activities.reduce((sum, row) => sum + activityBillAmount(row), 0),
    stakeholders: stakeholders.sort((a, b) => a.stakeholder_name.localeCompare(b.stakeholder_name)),
  };
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const periodFrom = request.nextUrl.searchParams.get('period_from');
  const periodTo = request.nextUrl.searchParams.get('period_to');
  const preview = request.nextUrl.searchParams.get('preview') === '1';
  const unbilledView = request.nextUrl.searchParams.get('view') === 'unbilled';
  const stakeholderIdsParam = request.nextUrl.searchParams.get('stakeholder_ids');
  const stakeholderIds = stakeholderIdsParam
    ? stakeholderIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    if (unbilledView) {
      const activities = await fetchUnbilledActivities(
        projectId,
        periodFrom || undefined,
        periodTo || undefined,
        stakeholderIds
      );
      return NextResponse.json({ data: toUnbilledActivityRows(activities) });
    }

    if (preview) {
      if (!periodFrom || !periodTo) {
        return NextResponse.json({ error: 'period_from and period_to required for preview' }, { status: 400 });
      }
      if (periodFrom > periodTo) {
        return NextResponse.json({ error: 'period_from must be on or before period_to' }, { status: 400 });
      }

      const activities = await fetchUnbilledActivities(
        projectId,
        periodFrom,
        periodTo,
        stakeholderIds
      );
      return NextResponse.json({ data: buildPreview(periodFrom, periodTo, activities) });
    }

    const service = getServiceClient();
    const { data, error } = await service
      .from('stakeholder_bills')
      .select(BILL_LIST_SELECT)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { project_id, period_from, period_to, stakeholder_ids } = body as {
    project_id?: string;
    period_from?: string;
    period_to?: string;
    stakeholder_ids?: string[];
  };

  if (!project_id || !period_from || !period_to) {
    return NextResponse.json(
      { error: 'project_id, period_from, and period_to are required' },
      { status: 400 }
    );
  }

  if (period_from > period_to) {
    return NextResponse.json({ error: 'period_from must be on or before period_to' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const activities = await fetchUnbilledActivities(
      project_id,
      period_from,
      period_to,
      stakeholder_ids?.length ? stakeholder_ids : undefined
    );

    if (!activities.length) {
      return NextResponse.json(
        { error: 'No unbilled daily activities found for the selected period' },
        { status: 400 }
      );
    }

    const service = getServiceClient();
    const groups = groupActivitiesByStakeholder(activities);
    const createdBills = [];
    let sequence = 1;

    for (const [stakeholderId, stakeholderActivities] of groups.entries()) {
      const totalAmount = stakeholderActivities.reduce((sum, row) => sum + activityBillAmount(row), 0);
      const billNumber = formatBillNumber(period_from, period_to, sequence);
      sequence += 1;

      const { data: bill, error: billError } = await service
        .from('stakeholder_bills')
        .insert({
          project_id,
          stakeholder_id: stakeholderId,
          bill_number: billNumber,
          period_from,
          period_to,
          total_amount: totalAmount,
          status: 'draft',
        })
        .select('id, bill_number, stakeholder_id, period_from, period_to, total_amount, status')
        .single();

      if (billError) {
        return NextResponse.json({ error: billError.message }, { status: 400 });
      }

      const itemRows = stakeholderActivities.map((activity) => ({
        bill_id: bill.id,
        daily_activity_id: activity.id,
        description: activityBillDescription(activity),
        quantity: activityBillQuantity(activity),
        unit_rate: activityBillUnitRate(activity),
        amount: activityBillAmount(activity),
      }));

      const { error: itemsError } = await service.from('stakeholder_bill_items').insert(itemRows);
      if (itemsError) {
        await service.from('stakeholder_bills').delete().eq('id', bill.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }

      createdBills.push({
        ...bill,
        activity_count: stakeholderActivities.length,
      });
    }

    return NextResponse.json({
      data: {
        bills_created: createdBills.length,
        activities_billed: activities.length,
        total_amount: activities.reduce((sum, row) => sum + activityBillAmount(row), 0),
        bills: createdBills,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
