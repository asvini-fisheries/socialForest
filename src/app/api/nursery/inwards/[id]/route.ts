import { NextRequest, NextResponse } from 'next/server';
import { INWARD_BILL_SELECT, getServiceClient, requireProjectAccess } from '@/lib/nursery-api';
import type { BillStatus } from '@/types/database';

type RouteContext = { params: Promise<{ id: string }> };

const STATUS_TRANSITIONS: Record<string, { next: BillStatus; fields: Record<string, unknown> }> = {
  submit: { next: 'submitted', fields: { submitted_at: new Date().toISOString() } },
  approve: { next: 'approved', fields: { approved_at: new Date().toISOString() } },
  reject: { next: 'rejected', fields: {} },
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const projectId = request.nextUrl.searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    const { data, error } = await service
      .from('nursery_inward_bills')
      .select(INWARD_BILL_SELECT)
      .eq('id', id)
      .eq('project_id', projectId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const { project_id, action } = body as { project_id?: string; action?: string };

  if (!project_id || !action) {
    return NextResponse.json({ error: 'project_id and action are required' }, { status: 400 });
  }

  const transition = STATUS_TRANSITIONS[action];
  if (!transition) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.role !== 'admin' && auth.role !== 'organisation') {
    return NextResponse.json({ error: 'Only organisation users can update bill status' }, { status: 403 });
  }

  try {
    const service = getServiceClient();
    const { data: existing, error: fetchError } = await service
      .from('nursery_inward_bills')
      .select('id, status')
      .eq('id', id)
      .eq('project_id', project_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    if (action === 'submit' && existing.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft bills can be submitted' }, { status: 400 });
    }
    if (action === 'approve' && existing.status !== 'submitted' && existing.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft or submitted bills can be approved' }, { status: 400 });
    }
    if (action === 'reject' && existing.status !== 'submitted') {
      return NextResponse.json({ error: 'Only submitted bills can be rejected' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      status: transition.next,
      ...transition.fields,
    };
    if (action === 'approve') updatePayload.approved_by = auth.user.id;

    const { data, error } = await service
      .from('nursery_inward_bills')
      .update(updatePayload)
      .eq('id', id)
      .select(INWARD_BILL_SELECT)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
