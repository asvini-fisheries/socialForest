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
