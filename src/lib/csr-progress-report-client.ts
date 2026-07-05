'use client';

import { createClient } from '@/lib/supabase/client';

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export async function downloadCsrProgressReportPdf(
  projectId: string,
  filename: string,
  options?: { periodFrom?: string; periodTo?: string }
) {
  const params = new URLSearchParams({ project_id: projectId });
  if (options?.periodFrom) params.set('period_from', options.periodFrom);
  if (options?.periodTo) params.set('period_to', options.periodTo);

  const res = await fetch(`/api/projects/csr-progress/pdf?${params}`, {
    headers: await authHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'CSR progress PDF download failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
