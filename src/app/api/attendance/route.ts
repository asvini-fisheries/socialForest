import { NextRequest, NextResponse } from 'next/server';
import {
  ATTENDANCE_SELECT,
  getServiceClient,
  requireProjectAccess,
} from '@/lib/attendance-api';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const date = request.nextUrl.searchParams.get('date');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    let query = service
      .from('daily_attendance')
      .select(ATTENDANCE_SELECT)
      .eq('project_id', projectId)
      .order('attendance_date', { ascending: false });

    if (date) query = query.eq('attendance_date', date);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server configuration error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { project_id, organisation_id, attendance_date, entries } = body;

  if (!project_id || !organisation_id || !attendance_date || !Array.isArray(entries)) {
    return NextResponse.json(
      { error: 'project_id, organisation_id, attendance_date, and entries are required' },
      { status: 400 }
    );
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    const upserts = entries.map(
      (e: { employee_id: string; status: string; record_id?: string }) => ({
        project_id,
        organisation_id,
        employee_id: e.employee_id,
        attendance_date,
        status: e.status,
        recorded_by: auth.user.id,
        ...(e.record_id ? { id: e.record_id } : {}),
      })
    );

    const { error } = await service
      .from('daily_attendance')
      .upsert(upserts, { onConflict: 'project_id,employee_id,attendance_date' });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, count: upserts.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server configuration error' },
      { status: 500 }
    );
  }
}
