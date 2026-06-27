import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import {
  getMasterServiceClient,
  requireMasterAdmin,
  sanitizeMasterPayload,
  usesSoftDelete,
} from '@/lib/masters-admin';

type RouteContext = { params: Promise<{ table: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { table } = await context.params;
  const spec = getMasterTableSpec(table);
  if (!spec) return NextResponse.json({ error: 'Unknown master table' }, { status: 404 });

  const auth = await requireMasterAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const payload = sanitizeMasterPayload(spec, body, 'insert');

  const service = getMasterServiceClient();
  const { data, error } = await service.from(table).insert(payload).select('id').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: data.id });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { table } = await context.params;
  const spec = getMasterTableSpec(table);
  if (!spec) return NextResponse.json({ error: 'Unknown master table' }, { status: 404 });

  const auth = await requireMasterAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
  }

  const payload = sanitizeMasterPayload(spec, body, 'update');
  const service = getMasterServiceClient();
  const { error } = await service.from(table).update(payload).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { table } = await context.params;
  const spec = getMasterTableSpec(table);
  if (!spec) return NextResponse.json({ error: 'Unknown master table' }, { status: 404 });

  const auth = await requireMasterAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Record ID required' }, { status: 400 });

  const service = getMasterServiceClient();
  const { error } = usesSoftDelete(spec, table)
    ? await service.from(table).update({ is_active: false }).eq('id', id)
    : await service.from(table).delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
