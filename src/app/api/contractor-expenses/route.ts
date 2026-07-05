import { NextRequest, NextResponse } from 'next/server';
import {
  EXPENSE_LIST_SELECT,
  EXPENSE_SELECT,
  getServiceClient,
  requireProjectAccess,
} from '@/lib/contractor-expenses-api';

export async function GET(request: NextRequest) {
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
      .from('contractor_expenses')
      .select(EXPENSE_LIST_SELECT)
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = body.project_id as string;
    const stakeholderId = body.stakeholder_id as string;
    const expenseDate = body.expense_date as string;
    const amount = Number(body.amount);

    if (!projectId || !stakeholderId || !expenseDate) {
      return NextResponse.json(
        { error: 'project_id, stakeholder_id, and expense_date are required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const auth = await requireProjectAccess(projectId, request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const service = getServiceClient();
    const { data: expense, error } = await service
      .from('contractor_expenses')
      .insert({
        project_id: projectId,
        stakeholder_id: stakeholderId,
        expense_date: expenseDate,
        category: body.category?.trim() || null,
        description: body.description?.trim() || null,
        amount,
        vendor_name: body.vendor_name?.trim() || null,
        invoice_number: body.invoice_number?.trim() || null,
        remarks: body.remarks?.trim() || null,
        recorded_by: auth.user.id,
      })
      .select(EXPENSE_SELECT)
      .single();

    if (error || !expense) {
      return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 400 });
    }

    const attachments = (body.attachments || []) as { file_url: string; file_name: string }[];
    if (attachments.length) {
      const { error: attachError } = await service.from('contractor_expense_attachments').insert(
        attachments.map((a) => ({
          expense_id: expense.id,
          file_url: a.file_url,
          file_name: a.file_name || null,
        }))
      );
      if (attachError) {
        return NextResponse.json({ error: attachError.message }, { status: 400 });
      }
    }

    const { data: full, error: loadError } = await service
      .from('contractor_expenses')
      .select(EXPENSE_SELECT)
      .eq('id', expense.id)
      .single();

    if (loadError) return NextResponse.json({ data: expense });
    return NextResponse.json({ data: full });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
