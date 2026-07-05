import { NextRequest, NextResponse } from 'next/server';
import {
  INVOICE_DETAIL_SELECT,
  INVOICE_LIST_SELECT,
  formatInvoiceNumber,
  getServiceClient,
  requireProjectAccess,
} from '@/lib/contractor-invoices-api';

async function loadInvoicedSourceIds(service: ReturnType<typeof getServiceClient>) {
  const { data } = await service
    .from('contractor_invoice_items')
    .select('stakeholder_bill_id, contractor_expense_id');

  const billIds = new Set<string>();
  const expenseIds = new Set<string>();
  for (const row of data || []) {
    if (row.stakeholder_bill_id) billIds.add(row.stakeholder_bill_id);
    if (row.contractor_expense_id) expenseIds.add(row.contractor_expense_id);
  }
  return { billIds, expenseIds };
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const stakeholderId = request.nextUrl.searchParams.get('stakeholder_id');
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

    if (view === 'sources') {
      if (!stakeholderId) {
        return NextResponse.json({ error: 'stakeholder_id required for sources view' }, { status: 400 });
      }

      const { billIds, expenseIds } = await loadInvoicedSourceIds(service);

      const [billsRes, expensesRes] = await Promise.all([
        service
          .from('stakeholder_bills')
          .select('id, bill_number, period_from, period_to, total_amount, status')
          .eq('project_id', projectId)
          .eq('stakeholder_id', stakeholderId)
          .eq('status', 'approved')
          .order('period_from', { ascending: false }),
        service
          .from('contractor_expenses')
          .select('id, expense_date, category, description, amount, invoice_number')
          .eq('project_id', projectId)
          .eq('stakeholder_id', stakeholderId)
          .order('expense_date', { ascending: false }),
      ]);

      if (billsRes.error) {
        return NextResponse.json({ error: billsRes.error.message }, { status: 400 });
      }
      if (expensesRes.error) {
        return NextResponse.json({ error: expensesRes.error.message }, { status: 400 });
      }

      return NextResponse.json({
        data: {
          activity_bills: (billsRes.data || []).filter((b) => !billIds.has(b.id)),
          expenses: (expensesRes.data || []).filter((e) => !expenseIds.has(e.id)),
        },
      });
    }

    const { data, error } = await service
      .from('contractor_invoices')
      .select(INVOICE_LIST_SELECT)
      .eq('project_id', projectId)
      .order('invoice_date', { ascending: false })
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
    const invoiceDate = body.invoice_date as string;
    const activityBillIds = (body.activity_bill_ids || []) as string[];
    const expenseIds = (body.expense_ids || []) as string[];

    if (!projectId || !stakeholderId || !invoiceDate) {
      return NextResponse.json(
        { error: 'project_id, stakeholder_id, and invoice_date are required' },
        { status: 400 }
      );
    }

    if (!activityBillIds.length && !expenseIds.length) {
      return NextResponse.json(
        { error: 'Select at least one activity bill or expense' },
        { status: 400 }
      );
    }

    const auth = await requireProjectAccess(projectId, request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const service = getServiceClient();

    const { data: project, error: projectError } = await service
      .from('projects')
      .select('id, code, organisation_id, csr_partner_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project?.organisation_id) {
      return NextResponse.json({ error: 'Project organisation not found' }, { status: 400 });
    }

    const { billIds: invoicedBills, expenseIds: invoicedExpenses } =
      await loadInvoicedSourceIds(service);

    const lineItems: {
      source_type: 'activity_bill' | 'expense';
      stakeholder_bill_id?: string;
      contractor_expense_id?: string;
      description: string;
      amount: number;
    }[] = [];

    let periodFrom: string | null = body.period_from || null;
    let periodTo: string | null = body.period_to || null;

    if (activityBillIds.length) {
      const { data: bills, error: billsError } = await service
        .from('stakeholder_bills')
        .select('id, bill_number, period_from, period_to, total_amount, status, stakeholder_id')
        .eq('project_id', projectId)
        .in('id', activityBillIds);

      if (billsError) {
        return NextResponse.json({ error: billsError.message }, { status: 400 });
      }
      if ((bills || []).length !== activityBillIds.length) {
        return NextResponse.json({ error: 'One or more activity bills not found' }, { status: 400 });
      }

      for (const bill of bills || []) {
        if (bill.stakeholder_id !== stakeholderId) {
          return NextResponse.json({ error: 'All bills must belong to the selected contractor' }, { status: 400 });
        }
        if (bill.status !== 'approved') {
          return NextResponse.json({ error: 'Only approved activity bills can be invoiced' }, { status: 400 });
        }
        if (invoicedBills.has(bill.id)) {
          return NextResponse.json({ error: `Bill ${bill.bill_number || bill.id} is already invoiced` }, { status: 400 });
        }
        lineItems.push({
          source_type: 'activity_bill',
          stakeholder_bill_id: bill.id,
          description: `Activity Bill ${bill.bill_number || ''} (${bill.period_from} to ${bill.period_to})`.trim(),
          amount: Number(bill.total_amount) || 0,
        });
        if (!periodFrom || bill.period_from < periodFrom) periodFrom = bill.period_from;
        if (!periodTo || bill.period_to > periodTo) periodTo = bill.period_to;
      }
    }

    if (expenseIds.length) {
      const { data: expenses, error: expensesError } = await service
        .from('contractor_expenses')
        .select('id, expense_date, category, description, amount, stakeholder_id, invoice_number')
        .eq('project_id', projectId)
        .in('id', expenseIds);

      if (expensesError) {
        return NextResponse.json({ error: expensesError.message }, { status: 400 });
      }
      if ((expenses || []).length !== expenseIds.length) {
        return NextResponse.json({ error: 'One or more expenses not found' }, { status: 400 });
      }

      for (const expense of expenses || []) {
        if (expense.stakeholder_id !== stakeholderId) {
          return NextResponse.json({ error: 'All expenses must belong to the selected contractor' }, { status: 400 });
        }
        if (invoicedExpenses.has(expense.id)) {
          return NextResponse.json({ error: 'One or more expenses are already invoiced' }, { status: 400 });
        }
        const label = [expense.category, expense.description, expense.invoice_number]
          .filter(Boolean)
          .join(' — ');
        lineItems.push({
          source_type: 'expense',
          contractor_expense_id: expense.id,
          description: label || `Expense ${expense.expense_date}`,
          amount: Number(expense.amount) || 0,
        });
        if (!periodFrom || expense.expense_date < periodFrom) periodFrom = expense.expense_date;
        if (!periodTo || expense.expense_date > periodTo) periodTo = expense.expense_date;
      }
    }

    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Invoice total must be greater than zero' }, { status: 400 });
    }

    const invoiceNumber =
      body.invoice_number?.trim() || formatInvoiceNumber(project.code, lineItems.length);

    const { data: invoice, error: invoiceError } = await service
      .from('contractor_invoices')
      .insert({
        project_id: projectId,
        stakeholder_id: stakeholderId,
        organisation_id: project.organisation_id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        period_from: periodFrom,
        period_to: periodTo,
        total_amount: totalAmount,
        status: 'draft',
        remarks: body.remarks?.trim() || null,
      })
      .select('id')
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: invoiceError?.message || 'Invoice insert failed' }, { status: 400 });
    }

    const { error: itemsError } = await service.from('contractor_invoice_items').insert(
      lineItems.map((item) => ({
        invoice_id: invoice.id,
        source_type: item.source_type,
        stakeholder_bill_id: item.stakeholder_bill_id || null,
        contractor_expense_id: item.contractor_expense_id || null,
        description: item.description,
        amount: item.amount,
      }))
    );

    if (itemsError) {
      await service.from('contractor_invoices').delete().eq('id', invoice.id);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const { data: full, error: loadError } = await service
      .from('contractor_invoices')
      .select(INVOICE_DETAIL_SELECT)
      .eq('id', invoice.id)
      .single();

    if (loadError) return NextResponse.json({ data: { id: invoice.id } });
    return NextResponse.json({ data: full });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
