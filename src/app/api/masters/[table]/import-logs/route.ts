import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { requireAdmin, getServiceClient, jsonError } from '@/lib/masters-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return jsonError(auth.error, auth.status);

  const { table } = await params;
  const spec = getMasterTableSpec(table);
  if (!spec) return jsonError('Unknown master table', 404);

  const limit = Number(request.nextUrl.searchParams.get('limit') || 20);
  const service = getServiceClient();

  const { data, error } = await service
    .from('master_import_logs')
    .select('*, uploader:users(full_name)')
    .eq('master_table', table)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) {
    if (error.message.includes('master_import_logs')) {
      return NextResponse.json({ logs: [], migrationRequired: true });
    }
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ logs: data ?? [] });
}
