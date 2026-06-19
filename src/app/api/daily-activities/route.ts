import { NextRequest, NextResponse } from 'next/server';
import { ACTIVITY_SELECT, getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from('daily_activity_updates')
    .select(ACTIVITY_SELECT)
    .eq('project_id', projectId)
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

async function getOrCreateProjectActivity(
  service: ReturnType<typeof getServiceClient>,
  projectId: string,
  activityId: string,
  projectAreaId?: string | null
) {
  const { data: rpcId, error: rpcErr } = await service.rpc('get_or_create_project_activity', {
    p_project_id: projectId,
    p_activity_id: activityId,
    p_project_area_id: projectAreaId || null,
  });

  if (!rpcErr && rpcId) return rpcId as string;

  const { data: existing } = await service
    .from('project_activities')
    .select('id')
    .eq('project_id', projectId)
    .eq('activity_id', activityId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await service
    .from('project_activities')
    .insert({
      project_id: projectId,
      activity_id: activityId,
      project_area_id: projectAreaId || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    project_id,
    activity_id,
    stakeholder_id,
    project_area_id,
    activity_date,
    quantity_completed,
    remarks,
    resources_used,
    image_path,
    image_caption,
  } = body;

  if (!project_id || !activity_id || !stakeholder_id || !activity_date) {
    return NextResponse.json(
      { error: 'project_id, activity_id, stakeholder_id, and activity_date are required' },
      { status: 400 }
    );
  }

  const auth = await requireProjectAccess(project_id);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let service;
  try {
    service = getServiceClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const projectActivityId = await getOrCreateProjectActivity(
      service,
      project_id,
      activity_id,
      project_area_id
    );

    const { data: entry, error: entryErr } = await service
      .from('daily_activity_updates')
      .insert({
        project_id,
        project_activity_id: projectActivityId,
        stakeholder_id,
        project_area_id: project_area_id || null,
        activity_date,
        quantity_completed: quantity_completed != null ? Number(quantity_completed) : null,
        remarks: remarks || null,
        submitted_by: auth.user.id,
      })
      .select('id')
      .single();

    if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 400 });

    if (resources_used?.length) {
      const rows = resources_used
        .filter((r: { resource_id?: string; quantity_used?: number }) => r.resource_id && r.quantity_used)
        .map((r: { resource_id: string; quantity_used: number; unit_rate?: number }) => ({
          daily_activity_id: entry.id,
          resource_id: r.resource_id,
          quantity_used: Number(r.quantity_used),
          unit_rate: r.unit_rate != null ? Number(r.unit_rate) : null,
        }));
      if (rows.length) {
        const { error: resErr } = await service.from('daily_activity_resources_used').insert(rows);
        if (resErr) return NextResponse.json({ error: resErr.message }, { status: 400 });
      }
    }

    if (image_path) {
      const { error: imgErr } = await service.from('daily_activity_images').insert({
        daily_activity_id: entry.id,
        image_url: image_path,
        caption: image_caption || remarks || null,
      });
      if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 400 });
    }

    const { data: full, error: fetchErr } = await service
      .from('daily_activity_updates')
      .select(ACTIVITY_SELECT)
      .eq('id', entry.id)
      .single();

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    return NextResponse.json({ data: full });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create entry' },
      { status: 400 }
    );
  }
}
