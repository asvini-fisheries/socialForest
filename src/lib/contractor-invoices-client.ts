'use client';

import { createClient } from '@/lib/supabase/client';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export type InvoiceSourceBill = {
  id: string;
  bill_number: string | null;
  period_from: string;
  period_to: string;
  total_amount: number;
  status: string;
};

export type InvoiceSourceExpense = {
  id: string;
  expense_date: string;
  category: string | null;
  description: string | null;
  amount: number;
  invoice_number: string | null;
};

export type InvoiceSources = {
  activity_bills: InvoiceSourceBill[];
  expenses: InvoiceSourceExpense[];
};

export async function fetchContractorInvoices(projectId: string) {
  const res = await fetch(`/api/contractor-invoices?project_id=${encodeURIComponent(projectId)}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load invoices');
  return json.data || [];
}

export async function fetchInvoiceSources(projectId: string, stakeholderId: string) {
  const params = new URLSearchParams({
    project_id: projectId,
    stakeholder_id: stakeholderId,
    view: 'sources',
  });
  const res = await fetch(`/api/contractor-invoices?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load bill and expense sources');
  return json.data as InvoiceSources;
}

export async function fetchContractorInvoice(projectId: string, id: string) {
  const res = await fetch(
    `/api/contractor-invoices/${id}?project_id=${encodeURIComponent(projectId)}`,
    { headers: await authHeaders(), credentials: 'include' }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load invoice');
  return json.data;
}

export async function createContractorInvoice(payload: {
  project_id: string;
  stakeholder_id: string;
  invoice_date: string;
  period_from?: string | null;
  period_to?: string | null;
  invoice_number?: string | null;
  remarks?: string | null;
  activity_bill_ids: string[];
  expense_ids: string[];
}) {
  const res = await fetch('/api/contractor-invoices', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create invoice');
  return json.data;
}

export async function downloadContractorInvoicePdf(
  projectId: string,
  invoiceId: string,
  filename: string
) {
  const headers = await authHeaders();
  const res = await fetch(
    `/api/contractor-invoices/${invoiceId}/pdf?project_id=${encodeURIComponent(projectId)}`,
    { headers, credentials: 'include' }
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'PDF download failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
