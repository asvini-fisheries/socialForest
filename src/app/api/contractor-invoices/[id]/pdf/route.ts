import { NextRequest, NextResponse } from 'next/server';
import { INVOICE_DETAIL_SELECT, getServiceClient, requireProjectAccess } from '@/lib/contractor-invoices-api';
import {
  buildContractorInvoicePdf,
  type ContractorInvoicePdfInput,
} from '@/lib/contractor-invoice-pdf';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const projectId = request.nextUrl.searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    const { data, error } = await service
      .from('contractor_invoices')
      .select(INVOICE_DETAIL_SELECT)
      .eq('id', id)
      .eq('project_id', projectId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Invoice not found' }, { status: 404 });
    }

    const pdfBytes = buildContractorInvoicePdf(data as ContractorInvoicePdfInput);
    const filename = `${data.invoice_number || 'contractor-invoice'}.pdf`;

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
