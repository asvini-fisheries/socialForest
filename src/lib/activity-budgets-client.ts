'use client';

import { createClient } from '@/lib/supabase/client';

async function authHeaders(options?: { json?: boolean }): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (options?.json !== false) headers['Content-Type'] = 'application/json';
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

export async function downloadActivityBudgetTemplate(projectId: string) {
  const headers = await authHeaders();
  const res = await fetch(
    `/api/activity-budgets/template?project_id=${encodeURIComponent(projectId)}`,
    { headers, credentials: 'include' }
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Template download failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'activity_budgets_upload_format.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importActivityBudgets(projectId: string, file: File) {
  const form = new FormData();
  form.append('project_id', projectId);
  form.append('file', file);

  const res = await fetch('/api/activity-budgets/import', {
    method: 'POST',
    headers: await authHeaders({ json: false }),
    credentials: 'include',
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.errors?.[0]?.message || 'Import failed');
  return json as {
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: { row: number; column: string; value: string; message: string }[];
    status: string;
  };
}

export async function deleteActivityBudget(projectId: string, id: string) {
  const res = await fetch(
    `/api/activity-budgets/${id}?project_id=${encodeURIComponent(projectId)}`,
    { method: 'DELETE', headers: await authHeaders(), credentials: 'include' }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete budget');
}
