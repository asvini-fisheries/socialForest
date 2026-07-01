import { NextRequest, NextResponse } from 'next/server';
import {
  OUTWARD_BILL_SELECT,
  OUTWARD_LIST_SELECT,
  getServiceClient,
  requireProjectAccess,
} from '@/lib/nursery-api';
import { normalizeSaplingLines, totalSaplingQuantity } from '@/lib/nursery-utils';

const OUTWARD_LIST_WITH_ITEMS = `
  ${OUTWARD_LIST_SELECT.trim()},
  items:nursery_outward_items(quantity)
`;

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const search = (request.nextUrl.searchParams.get('search') || '').trim().toLowerCase();

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
      .from('nursery_outward_bills')
      .select(OUTWARD_LIST_WITH_ITEMS)
      .eq('project_id', projectId)
      .order('issue_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    type OutwardListRow = {
      items?: { quantity: number }[];
      project_area?: { name?: string; code?: string } | null;
      log_number?: string | null;
      issue_category?: string;
      remarks?: string | null;
    };

    let rows = (data || []).map((row) => {
      const typed = row as OutwardListRow;
      const items = typed.items || [];
      return {
        ...typed,
        total_saplings: totalSaplingQuantity(items),
      };
    });

    if (search) {
      rows = rows.filter((row) => {
        const area = row.project_area as { name?: string; code?: string } | null;
        const haystack = [
          row.log_number,
          row.issue_category,
          area?.name,
          area?.code,
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
  const { project_id, project_area_id, issue_category, log_number, issue_date, remarks, items } =
    body;

  if (!project_id || !project_area_id || !log_number || !issue_date) {
    return NextResponse.json(
      { error: 'project_id, project_area_id, log_number, and issue_date are required' },
      { status: 400 }
    );
  }

  const lines = normalizeSaplingLines(items || []);
  if (!lines.length) {
    return NextResponse.json({ error: 'At least one sapling line is required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(project_id, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();
    const totalSaplings = totalSaplingQuantity(lines);

    const { data: bill, error: billError } = await service
      .from('nursery_outward_bills')
      .insert({
        project_id,
        project_area_id,
        issue_category: issue_category || 'plantation',
        log_number: String(log_number).trim(),
        issue_date,
        remarks: remarks || null,
        total_amount: totalSaplings,
        recorded_by: auth.user.id,
      })
      .select('id')
      .single();

    if (billError) return NextResponse.json({ error: billError.message }, { status: 400 });

    const itemRows = lines.map((line) => ({
      bill_id: bill.id,
      resource_id: line.resource_id,
      quantity: line.quantity,
      unit_rate: 0,
      amount: 0,
    }));

    const { error: itemsError } = await service.from('nursery_outward_items').insert(itemRows);
    if (itemsError) {
      await service.from('nursery_outward_bills').delete().eq('id', bill.id);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const { data: full, error: fetchError } = await service
      .from('nursery_outward_bills')
      .select(OUTWARD_BILL_SELECT)
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
