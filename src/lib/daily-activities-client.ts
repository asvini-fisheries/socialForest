'use client';

import { createClient } from '@/lib/supabase/client';

export async function fetchDailyActivities(projectId: string): Promise<unknown[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`/api/daily-activities?project_id=${encodeURIComponent(projectId)}`, {
    headers,
    credentials: 'include',
  });

  const json = (await res.json()) as { data?: unknown[]; error?: string };
  if (!res.ok) {
    throw new Error(json.error || `Failed to load activities (${res.status})`);
  }

  return json.data || [];
}
