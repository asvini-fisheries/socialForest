import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { buildTemplateBuffer } from '@/lib/master-excel';
import { requireAdmin, jsonError } from '@/lib/masters-api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return jsonError(auth.error, auth.status);

  const { table } = await params;
  const spec = getMasterTableSpec(table);
  if (!spec) return jsonError('Unknown master table', 404);
  if (!spec.importEnabled) return jsonError('Import not enabled for this master', 400);

  const buffer = buildTemplateBuffer(spec.title, spec.importColumns);
  const filename = `${spec.title.replace(/\s+/g, '_')}_upload_format.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
