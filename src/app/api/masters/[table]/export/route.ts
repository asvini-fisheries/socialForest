import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { exportRowsBuffer } from '@/lib/master-excel';
import { requireAdmin, getServiceClient, jsonError } from '@/lib/masters-api';

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
  const exportColumns = spec.importColumns.length ? spec.importColumns : [];
  const buffer = exportRowsBuffer(spec.title, exportColumns, rows);
  const filename = `${spec.title.replace(/\s+/g, '_')}_export.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
