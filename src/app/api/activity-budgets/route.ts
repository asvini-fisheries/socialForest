import { NextRequest, NextResponse } from 'next/server';
import { BUDGET_SELECT, getServiceClient, requireProjectAccess } from '@/lib/activity-budgets-api';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from('project_area_activity_budgets')
    .select(BUDGET_SELECT)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { project_id, activity_id, project_area_id, planned_quantity, remarks, resources } = body;

  if (!project_id || !activity_id) {
    return NextResponse.json({ error: 'project_id and activity_id are required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();

  try {
    const { data: budget, error: budgetErr } = await service
      .from('project_area_activity_budgets')
      .insert({
        project_id,
        activity_id,
        project_area_id: project_area_id || null,
        planned_quantity: planned_quantity != null ? Number(planned_quantity) : null,
        remarks: remarks || null,
      })
      .select('id')
      .single();

    if (budgetErr) return NextResponse.json({ error: budgetErr.message }, { status: 400 });

    if (resources?.length) {
      const rows = resources
        .filter((r: { resource_id?: string; planned_quantity?: number }) => r.resource_id && r.planned_quantity)
        .map((r: { resource_id: string; planned_quantity: number; unit_rate?: number }) => ({
          budget_id: budget.id,
          resource_id: r.resource_id,
          planned_quantity: Number(r.planned_quantity),
          unit_rate: r.unit_rate != null ? Number(r.unit_rate) : 0,
        }));
      if (rows.length) {
        const { error: resErr } = await service.from('project_area_activity_budget_items').insert(rows);
        if (resErr) return NextResponse.json({ error: resErr.message }, { status: 400 });
      }
    }

    const { data: full, error: fetchErr } = await service
      .from('project_area_activity_budgets')
      .select(BUDGET_SELECT)
      .eq('id', budget.id)
      .single();

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    return NextResponse.json({ data: full });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create budget' },
      { status: 400 }
    );
  }
}
