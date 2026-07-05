'use client';

import { createClient } from '@/lib/supabase/client';

const EXPENSE_BUCKET = 'expense-attachments';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export async function uploadExpenseAttachment(
  projectId: string,
  file: File
): Promise<{ file_url: string; file_name: string }> {
  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const path = `expenses/${projectId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(EXPENSE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(EXPENSE_BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl, file_name: file.name };
}

export async function fetchContractorExpenses(projectId: string) {
  const res = await fetch(`/api/contractor-expenses?project_id=${encodeURIComponent(projectId)}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load expenses');
  return json.data || [];
}

export async function fetchContractorExpense(projectId: string, id: string) {
  const res = await fetch(
    `/api/contractor-expenses/${id}?project_id=${encodeURIComponent(projectId)}`,
    { headers: await authHeaders(), credentials: 'include' }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load expense');
  return json.data;
}

export async function saveContractorExpense(payload: {
  project_id: string;
  stakeholder_id: string;
  expense_date: string;
  category?: string | null;
  description?: string | null;
  amount: number;
  vendor_name?: string | null;
  invoice_number?: string | null;
  remarks?: string | null;
  attachments?: { file_url: string; file_name: string }[];
}) {
  const res = await fetch('/api/contractor-expenses', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save expense');
  return json.data;
}
