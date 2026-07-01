import { NextRequest, NextResponse } from 'next/server';
import {
  INWARD_BILL_SELECT,
  INWARD_LIST_SELECT,
  INWARD_LINES_BILL_SELECT,
  getServiceClient,
  requireProjectAccess,
} from '@/lib/nursery-api';
import {
  computeLineAmount,
  computeTotalAmount,
  normalizeLines,
} from '@/lib/nursery-utils';
import { flattenInwardBillsToLines } from '@/lib/nursery-lines';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const search = (request.nextUrl.searchParams.get('search') || '').trim().toLowerCase();
  const view = request.nextUrl.searchParams.get('view');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();

    if (view === 'lines') {
      const { data, error } = await service
        .from('nursery_inward_bills')
        .select(INWARD_LINES_BILL_SELECT)
        .eq('project_id', projectId)
        .order('bill_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      let lines = flattenInwardBillsToLines((data || []) as Parameters<typeof flattenInwardBillsToLines>[0]);
      if (search) {
        lines = lines.filter((row) => {
          const haystack = [
            row.invoice_number,
            row.stakeholder_name,
            row.stakeholder_code,
            row.species_name,
            row.species_code,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(search);
        });
      }
      return NextResponse.json({ data: lines });
    }

    const { data, error } = await service
      .from('nursery_inward_bills')
      .select(INWARD_LIST_SELECT)
      .eq('project_id', projectId)
      .order('bill_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    let rows = data || [];
    if (search) {
      rows = rows.filter((row) => {
        const stakeholder = row.stakeholder as { name?: string; code?: string } | null;
        const haystack = [
          row.invoice_number,
          stakeholder?.name,
          stakeholder?.code,
          row.remarks,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    project_id,
    stakeholder_id,
    invoice_number,
    bill_date,
    image_url,
    remarks,
    items,
  } = body;

  if (!project_id || !stakeholder_id || !invoice_number || !bill_date) {
    return NextResponse.json(
      { error: 'project_id, stakeholder_id, invoice_number, and bill_date are required' },
      { status: 400 }
    );
  }

  const lines = normalizeLines(items || []);
  if (!lines.length) {
    return NextResponse.json({ error: 'At least one tree species line is required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    const total_amount = computeTotalAmount(lines);

    const { data: bill, error: billError } = await service
      .from('nursery_inward_bills')
      .insert({
        project_id,
        stakeholder_id,
        invoice_number: String(invoice_number).trim(),
        bill_date,
        image_url: image_url || null,
        remarks: remarks || null,
        total_amount,
        status: 'draft',
        recorded_by: auth.user.id,
      })
      .select('id')
      .single();

    if (billError) return NextResponse.json({ error: billError.message }, { status: 400 });

    const itemRows = lines.map((line) => ({
      bill_id: bill.id,
      resource_id: line.resource_id,
      quantity: line.quantity,
      unit_rate: line.unit_rate,
      amount: computeLineAmount(line.quantity, line.unit_rate),
    }));

    const { error: itemsError } = await service.from('nursery_inward_items').insert(itemRows);
    if (itemsError) {
      await service.from('nursery_inward_bills').delete().eq('id', bill.id);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const { data: full, error: fetchError } = await service
      .from('nursery_inward_bills')
      .select(INWARD_BILL_SELECT)
      .eq('id', bill.id)
      .single();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
    return NextResponse.json({ data: full });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
