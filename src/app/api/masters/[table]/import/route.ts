import { NextRequest, NextResponse } from 'next/server';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { sheetToRows } from '@/lib/master-excel';
import { importMasterRows } from '@/lib/master-import';
import { requireAdmin, getServiceClient, jsonError } from '@/lib/masters-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return jsonError(auth.error, auth.status);

  const { table } = await params;
  const spec = getMasterTableSpec(table);
  if (!spec) return jsonError('Unknown master table', 404);
  if (!spec.importEnabled) return jsonError('Excel import is not supported for this master', 400);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) return jsonError('Excel file is required', 400);

  const buffer = await file.arrayBuffer();
  let rawRows: Record<string, string>[];
  try {
    rawRows = sheetToRows(buffer);
  } catch {
    return jsonError('Could not read Excel file', 400);
  }

  if (!rawRows.length) return jsonError('Excel file has no data rows', 400);

  const service = getServiceClient();
  const result = await importMasterRows(service, spec, rawRows);

  const status = result.errorCount === 0 ? 'completed' : result.successCount > 0 ? 'completed' : 'failed';

  const { data: log, error: logErr } = await service
    .from('master_import_logs')
    .insert({
      master_table: table,
      file_name: file.name,
      uploaded_by: auth.user.id,
      total_rows: result.totalRows,
      success_count: result.successCount,
      error_count: result.errorCount,
      status,
      error_details: result.errors,
    })
    .select()
    .single();

  if (logErr) {
    return NextResponse.json({
      ...result,
      logWarning: logErr.message,
    });
  }

  return NextResponse.json({
    logId: log.id,
    totalRows: result.totalRows,
    successCount: result.successCount,
    errorCount: result.errorCount,
    errors: result.errors,
    status,
  });
}
