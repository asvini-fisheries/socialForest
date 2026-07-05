import { NextRequest, NextResponse } from 'next/server';
import { importActivityBudgetRows } from '@/lib/activity-budget-import';
import { getServiceClient, requireProjectAccess } from '@/lib/activity-budgets-api';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const projectId = String(formData.get('project_id') || '');
  const file = formData.get('file');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Excel file is required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const buffer = await file.arrayBuffer();
    const service = getServiceClient();
    const result = await importActivityBudgetRows(service, projectId, buffer);

    if (result.errorCount > 0 && result.successCount === 0) {
      return NextResponse.json(
        {
          error: 'Import failed',
          ...result,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...result,
      status: result.errorCount === 0 ? 'completed' : 'partial',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}
