import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildProjectActivityReportPdf } from '@/lib/project-activity-report-pdf';
import type { ClusterActivityTree } from '@/lib/project-activity-summaries';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const projectName = String(body.projectName || 'Project');
  const organisationName = body.organisationName ? String(body.organisationName) : undefined;
  const tree = (body.tree || []) as ClusterActivityTree[];

  const pdfBytes = buildProjectActivityReportPdf({ projectName, organisationName, tree });
  const filename = `${projectName.replace(/\s+/g, '_')}_activities.pdf`;

  return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
