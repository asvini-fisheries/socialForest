'use client';

import { createClient } from '@/lib/supabase/client';
import type { NurseryLineInput } from '@/lib/nursery-utils';

const NURSERY_IMAGE_BUCKET = 'invoice-attachments';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export async function uploadNurseryBillImage(
  projectId: string,
  file: File,
  prefix: 'inward' | 'outward'
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `nursery/${projectId}/${prefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(NURSERY_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(NURSERY_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchNurseryStock(projectId: string, search = '') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('nursery_stock')
    .select('*')
    .eq('project_id', projectId)
    .order('resource_name');
  if (error) throw new Error(error.message);
  const rows = data || [];
  if (!search.trim()) return rows;
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) =>
      String(r.resource_name || '').toLowerCase().includes(q) ||
      String(r.resource_code || '').toLowerCase().includes(q)
  );
}

export async function fetchInwardBills(projectId: string, search = '') {
  const params = new URLSearchParams({ project_id: projectId });
  if (search.trim()) params.set('search', search.trim());
  const res = await fetch(`/api/nursery/inwards?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load inward bills');
  return json.data || [];
}

export async function fetchInwardDetailLines(projectId: string, search = '') {
  const params = new URLSearchParams({ project_id: projectId, view: 'lines' });
  if (search.trim()) params.set('search', search.trim());
  const res = await fetch(`/api/nursery/inwards?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load inward details');
  return json.data || [];
}

export async function fetchInwardBill(projectId: string, id: string) {
  const res = await fetch(`/api/nursery/inwards/${id}?project_id=${projectId}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load inward bill');
  return json.data;
}

export async function updateInwardBillStatus(
  projectId: string,
  billId: string,
  action: 'submit' | 'approve' | 'reject'
) {
  const res = await fetch(`/api/nursery/inwards/${billId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify({ project_id: projectId, action }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update bill status');
  return json.data;
}

export async function downloadInwardBillPdf(projectId: string, billId: string, filename: string) {
  const res = await fetch(
    `/api/nursery/inwards/${billId}/pdf?project_id=${encodeURIComponent(projectId)}`,
    { headers: await authHeaders(), credentials: 'include' }
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

export async function fetchStockTransactions(projectId: string, resourceId: string) {
  const params = new URLSearchParams({ project_id: projectId, resource_id: resourceId });
  const res = await fetch(`/api/nursery/stock/transactions?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load stock transactions');
  return json.data || [];
}

export async function saveInwardBill(payload: {
  project_id: string;
  stakeholder_id: string;
  invoice_number: string;
  bill_date: string;
  image_url?: string | null;
  remarks?: string | null;
  items: NurseryLineInput[];
}) {
  const res = await fetch('/api/nursery/inwards', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save inward bill');
  return json.data;
}

export async function fetchOutwardBills(projectId: string, search = '') {
  const params = new URLSearchParams({ project_id: projectId });
  if (search.trim()) params.set('search', search.trim());
  const res = await fetch(`/api/nursery/outwards?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load outward entries');
  return json.data || [];
}

export async function fetchOutwardDetailLines(projectId: string, search = '') {
  const params = new URLSearchParams({ project_id: projectId, view: 'lines' });
  if (search.trim()) params.set('search', search.trim());
  const res = await fetch(`/api/nursery/outwards?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load outward details');
  return json.data || [];
}

export async function fetchOutwardBill(projectId: string, id: string) {
  const res = await fetch(`/api/nursery/outwards/${id}?project_id=${projectId}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load outward entry');
  return json.data;
}

export async function saveOutwardBill(payload: {
  project_id: string;
  project_area_id: string;
  issue_category?: string;
  log_number: string;
  issue_date: string;
  remarks?: string | null;
  items: { resource_id: string; quantity: number }[];
}) {
  const res = await fetch('/api/nursery/outwards', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save outward entry');
  return json.data;
}
