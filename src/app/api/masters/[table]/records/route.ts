import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { apiProjectFilterColumn } from '@/lib/master-project-scope';
import {
  assertServiceRoleKey,
  getMasterServiceClient,
  requireMasterAdmin,
} from '@/lib/masters-admin';

type RouteContext = { params: Promise<{ table: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { table } = await context.params;
  const spec = getMasterTableSpec(table);
  if (!spec) return NextResponse.json({ error: 'Unknown master table' }, { status: 404 });

  const auth = await requireMasterAdmin(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const keyError = assertServiceRoleKey();
  if (keyError) {
    return NextResponse.json({ error: keyError.error }, { status: keyError.status });
  }

  const service = getMasterServiceClient();
  const selectParam = request.nextUrl.searchParams.get('select');
  const select = selectParam || spec.selectQuery || '*';
  const projectId = request.nextUrl.searchParams.get('project_id');
  const filterColumn = apiProjectFilterColumn(table);

  let query = service.from(table).select(select).order(spec.orderBy);
  if (projectId && filterColumn) {
    query = query.eq(filterColumn, projectId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data || [] });
}
