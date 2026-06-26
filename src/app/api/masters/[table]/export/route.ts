import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { exportRowsBuffer } from '@/lib/master-excel';
import { requireAdmin, getServiceClient, jsonError } from '@/lib/masters-api';

function excelResponse(buffer: ArrayBuffer, filename: string) {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return jsonError(auth.error, auth.status);

  const { table } = await params;
  const spec = getMasterTableSpec(table);
  if (!spec) return jsonError('Unknown master table', 404);

  const service = getServiceClient();
  const { data, error } = await service
    .from(spec.table)
    .select(spec.selectQuery || '*')
    .order(spec.orderBy);

  if (error) return jsonError(error.message, 500);

  const rows = (data as unknown as Record<string, unknown>[]) || [];
  const buffer = exportRowsBuffer(spec.title, spec.importColumns, rows);
  const filename = `${spec.title.replace(/\s+/g, '_')}_export.xlsx`;
  return excelResponse(buffer, filename);
}

/** POST — export filtered rows from client search (no xlsx on browser) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return jsonError(auth.error, auth.status);

  const { table } = await params;
  const spec = getMasterTableSpec(table);
  if (!spec) return jsonError('Unknown master table', 404);

  const body = await request.json().catch(() => ({}));
  const rows = (body.rows as Record<string, unknown>[]) || [];
  const buffer = exportRowsBuffer(spec.title, spec.importColumns, rows);
  const filename = `${spec.title.replace(/\s+/g, '_')}_export.xlsx`;
  return excelResponse(buffer, filename);
}
