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

export async function fetchActivityBudgets(projectId: string) {
  const res = await fetch(`/api/activity-budgets?project_id=${encodeURIComponent(projectId)}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load activity budgets');
  return json.data || [];
}

export async function createActivityBudget(payload: {
  project_id: string;
  activity_id: string;
  project_area_id?: string | null;
  planned_quantity?: number | null;
  remarks?: string | null;
  resources: { resource_id: string; planned_quantity: number; unit_rate?: number }[];
}) {
  const res = await fetch('/api/activity-budgets', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create budget');
  return json.data;
}

export async function updateActivityBudget(
  id: string,
  payload: {
    project_id: string;
    project_area_id?: string | null;
    planned_quantity?: number | null;
    remarks?: string | null;
    resources: { resource_id: string; planned_quantity: number; unit_rate?: number }[];
  }
) {
  const res = await fetch(`/api/activity-budgets/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update budget');
  return json.data;
}

export async function deleteActivityBudget(projectId: string, id: string) {
  const res = await fetch(
    `/api/activity-budgets/${id}?project_id=${encodeURIComponent(projectId)}`,
    { method: 'DELETE', headers: await authHeaders(), credentials: 'include' }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete budget');
}
