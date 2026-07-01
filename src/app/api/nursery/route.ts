import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { project_id, type, stakeholder_id, resource_id, quantity, date, issue_category, remarks } =
    body;

  if (!project_id || !type || !resource_id || !quantity || !date) {
    return NextResponse.json(
      { error: 'project_id, type, resource_id, quantity, and date are required' },
      { status: 400 }
    );
  }

  if (type === 'inward' && !stakeholder_id) {
    return NextResponse.json({ error: 'stakeholder_id is required for inward entries' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 });
    }

    if (type === 'inward') {
      const { error } = await service.from('nursery_inwards').insert({
        project_id,
        stakeholder_id,
        resource_id,
        inward_date: date,
        quantity: qty,
        remarks: remarks || null,
        recorded_by: auth.user.id,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else if (type === 'issue') {
      const { error } = await service.from('nursery_issues').insert({
        project_id,
        resource_id,
        issue_date: date,
        issue_category: issue_category || 'plantation',
        quantity: qty,
        remarks: remarks || null,
        issued_by: auth.user.id,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'type must be inward or issue' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server configuration error' },
      { status: 500 }
    );
  }
}
