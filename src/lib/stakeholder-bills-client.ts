'use client';

import { createClient } from '@/lib/supabase/client';
import type { UnbilledActivityRow } from '@/lib/stakeholder-bills-unbilled';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export type BillPreviewStakeholder = {
  stakeholder_id: string;
  stakeholder_name: string;
  activity_count: number;
  total_amount: number;
};

export type BillPreview = {
  period_from: string;
  period_to: string;
  total_activities: number;
  total_amount: number;
  stakeholders: BillPreviewStakeholder[];
};

export async function fetchStakeholderBills(projectId: string) {
  const res = await fetch(`/api/stakeholder-bills?project_id=${encodeURIComponent(projectId)}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load bills');
  return json.data || [];
}

export async function fetchStakeholderBill(projectId: string, billId: string) {
  const res = await fetch(
    `/api/stakeholder-bills/${billId}?project_id=${encodeURIComponent(projectId)}`,
    { headers: await authHeaders(), credentials: 'include' }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load bill');
  return json.data;
}

export async function updateStakeholderBillStatus(
  projectId: string,
  billId: string,
  action: 'submit' | 'approve' | 'reject'
) {
  const res = await fetch(`/api/stakeholder-bills/${billId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify({ project_id: projectId, action }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update bill status');
  return json.data;
}

export async function downloadStakeholderBillPdf(projectId: string, billId: string, filename: string) {
  const headers = await authHeaders();
  const res = await fetch(
    `/api/stakeholder-bills/${billId}/pdf?project_id=${encodeURIComponent(projectId)}`,
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

export async function previewStakeholderBills(
  projectId: string,
  periodFrom: string,
  periodTo: string,
  stakeholderIds?: string[]
): Promise<BillPreview> {
  const params = new URLSearchParams({
    project_id: projectId,
    period_from: periodFrom,
    period_to: periodTo,
    preview: '1',
  });
  if (stakeholderIds?.length) {
    params.set('stakeholder_ids', stakeholderIds.join(','));
  }
  const res = await fetch(`/api/stakeholder-bills?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to preview bills');
  return json.data;
}

export async function fetchUnbilledActivities(
  projectId: string,
  periodFrom?: string,
  periodTo?: string
): Promise<UnbilledActivityRow[]> {
  const params = new URLSearchParams({ project_id: projectId, view: 'unbilled' });
  if (periodFrom) params.set('period_from', periodFrom);
  if (periodTo) params.set('period_to', periodTo);
  const res = await fetch(`/api/stakeholder-bills?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load unbilled activities');
  return json.data || [];
}

export async function generateStakeholderBills(payload: {
  project_id: string;
  period_from: string;
  period_to: string;
  stakeholder_ids?: string[];
}) {
  const res = await fetch('/api/stakeholder-bills', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to generate bills');
  return json.data;
}
