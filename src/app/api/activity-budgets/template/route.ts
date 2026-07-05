import { NextRequest, NextResponse } from 'next/server';
import { buildTemplateBuffer } from '@/lib/master-excel';
import { ACTIVITY_BUDGET_IMPORT_COLUMNS } from '@/lib/activity-budget-excel';
import { requireProjectAccess } from '@/lib/activity-budgets-api';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const buffer = buildTemplateBuffer('Activity Budgets', ACTIVITY_BUDGET_IMPORT_COLUMNS);
  const filename = 'activity_budgets_upload_format.xlsx';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
