import { NextRequest, NextResponse } from 'next/server';
import { BUDGET_SELECT, getServiceClient, requireProjectAccess } from '@/lib/activity-budgets-api';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { project_id, project_area_id, planned_quantity, remarks, resources } = body;

  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();

  const { error: updateErr } = await service
    .from('project_area_activity_budgets')
    .update({
      project_area_id: project_area_id || null,
      planned_quantity: planned_quantity != null ? Number(planned_quantity) : null,
      remarks: remarks || null,
    })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  await service.from('project_area_activity_budget_items').delete().eq('budget_id', id);

  if (resources?.length) {
    const rows = resources
      .filter((r: { resource_id?: string; planned_quantity?: number }) => r.resource_id && r.planned_quantity)
      .map((r: { resource_id: string; planned_quantity: number; unit_rate?: number }) => ({
        budget_id: id,
        resource_id: r.resource_id,
        planned_quantity: Number(r.planned_quantity),
        unit_rate: r.unit_rate != null ? Number(r.unit_rate) : 0,
      }));
    if (rows.length) {
      const { error: resErr } = await service.from('project_area_activity_budget_items').insert(rows);
      if (resErr) return NextResponse.json({ error: resErr.message }, { status: 400 });
    }
  }

  const { data, error } = await service
    .from('project_area_activity_budgets')
    .select(BUDGET_SELECT)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();
  const { error } = await service.from('project_area_activity_budgets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
