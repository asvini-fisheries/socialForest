import { NextRequest, NextResponse } from 'next/server';
import {
  loadCsrProgressReportData,
  requireCsrProgressAccess,
} from '@/lib/csr-progress-report-data';
import { buildCsrProgressReportPdf } from '@/lib/csr-progress-report-pdf';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireCsrProgressAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const periodFrom = request.nextUrl.searchParams.get('period_from');
    const periodTo = request.nextUrl.searchParams.get('period_to');
    const data = await loadCsrProgressReportData(projectId, {
      periodFrom,
      periodTo,
    });
    const pdfBytes = buildCsrProgressReportPdf(data);
    const filename = `${(data.projectCode || data.projectName).replace(/\s+/g, '_')}_csr_progress.pdf`;

    return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    );
  }
}
