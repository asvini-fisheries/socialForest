import { NextRequest, NextResponse } from 'next/server';
import { ACTIVITY_SELECT, getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { project_id, stakeholder_id, project_area_id, activity_date, quantity_completed, remarks, resources_used } =
    body;

  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();

  const { error: updateErr } = await service
    .from('daily_activity_updates')
    .update({
      stakeholder_id,
      project_area_id: project_area_id || null,
      activity_date,
      quantity_completed: quantity_completed != null ? Number(quantity_completed) : null,
      remarks: remarks || null,
      submitted_by: auth.user.id,
    })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  await service.from('daily_activity_resources_used').delete().eq('daily_activity_id', id);

  if (resources_used?.length) {
    const rows = resources_used
      .filter((r: { resource_id?: string; quantity_used?: number }) => r.resource_id && r.quantity_used)
      .map((r: { resource_id: string; quantity_used: number; unit_rate?: number }) => ({
        daily_activity_id: id,
        resource_id: r.resource_id,
        quantity_used: Number(r.quantity_used),
        unit_rate: r.unit_rate != null ? Number(r.unit_rate) : null,
      }));
    if (rows.length) {
      const { error: resErr } = await service.from('daily_activity_resources_used').insert(rows);
      if (resErr) return NextResponse.json({ error: resErr.message }, { status: 400 });
    }
  }

  const { data, error } = await service.from('daily_activity_updates').select(ACTIVITY_SELECT).eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();
  const { error } = await service.from('daily_activity_updates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
