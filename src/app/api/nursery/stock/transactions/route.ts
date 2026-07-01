import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, requireProjectAccess } from '@/lib/nursery-api';

export type StockTransactionRow = {
  txn_date: string;
  reference: string;
  party: string;
  receipt: number;
  issue: number;
  balance: number;
  txn_type: 'receipt' | 'issue';
};

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const resourceId = request.nextUrl.searchParams.get('resource_id');

  if (!projectId || !resourceId) {
    return NextResponse.json({ error: 'project_id and resource_id required' }, { status: 400 });
  }

  const auth = await requireProjectAccess(projectId, request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const service = getServiceClient();

    const [inwardRes, outwardRes] = await Promise.all([
      service
        .from('nursery_inward_items')
        .select(
          `quantity, bill:nursery_inward_bills!inner(bill_date, invoice_number, status, stakeholder:stakeholders(name))`
        )
        .eq('resource_id', resourceId)
        .eq('bill.project_id', projectId)
        .eq('bill.status', 'approved'),
      service
        .from('nursery_outward_items')
        .select(
          `quantity, bill:nursery_outward_bills!inner(issue_date, log_number, project_area:project_areas(name))`
        )
        .eq('resource_id', resourceId)
        .eq('bill.project_id', projectId),
    ]);

    if (inwardRes.error) return NextResponse.json({ error: inwardRes.error.message }, { status: 400 });
    if (outwardRes.error) return NextResponse.json({ error: outwardRes.error.message }, { status: 400 });

    type RawTxn = {
      txn_date: string;
      reference: string;
      party: string;
      receipt: number;
      issue: number;
    };

    const raw: RawTxn[] = [];

    for (const row of inwardRes.data || []) {
      const bill = row.bill as unknown as {
        bill_date: string;
        invoice_number: string;
        stakeholder?: { name?: string } | { name?: string }[] | null;
      };
      const stakeholder = Array.isArray(bill.stakeholder) ? bill.stakeholder[0] : bill.stakeholder;
      raw.push({
        txn_date: bill.bill_date,
        reference: bill.invoice_number,
        party: stakeholder?.name || 'Stakeholder',
        receipt: row.quantity,
        issue: 0,
      });
    }

    for (const row of outwardRes.data || []) {
      const bill = row.bill as unknown as {
        issue_date: string;
        log_number: string | null;
        project_area?: { name?: string } | { name?: string }[] | null;
      };
      const projectArea = Array.isArray(bill.project_area) ? bill.project_area[0] : bill.project_area;
      raw.push({
        txn_date: bill.issue_date,
        reference: bill.log_number || 'Outward',
        party: projectArea?.name || 'Project Area',
        receipt: 0,
        issue: row.quantity,
      });
    }

    raw.sort((a, b) => a.txn_date.localeCompare(b.txn_date));

    let balance = 0;
    const transactions: StockTransactionRow[] = raw.map((row) => {
      balance += row.receipt - row.issue;
      return {
        txn_date: row.txn_date,
        reference: row.reference,
        party: row.party,
        receipt: row.receipt,
        issue: row.issue,
        balance,
        txn_type: row.receipt > 0 ? 'receipt' : 'issue',
      };
    });

    return NextResponse.json({ data: transactions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
