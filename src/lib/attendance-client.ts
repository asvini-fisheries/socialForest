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

export async function fetchAttendanceRecords(projectId: string, date?: string) {
  const params = new URLSearchParams({ project_id: projectId });
  if (date) params.set('date', date);
  const res = await fetch(`/api/attendance?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load attendance');
  return json.data || [];
}

export async function saveAttendanceRecords(
  projectId: string,
  organisationId: string,
  date: string,
  entries: { employee_id: string; status: string; record_id?: string }[]
) {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: await authHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      project_id: projectId,
      organisation_id: organisationId,
      attendance_date: date,
      entries,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save attendance');
  return json;
}
