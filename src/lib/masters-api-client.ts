'use client';

import { createClient } from '@/lib/supabase/client';

export async function getMasterAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function parseMasterApiError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Request failed (${res.status})`;

  try {
    const json = JSON.parse(text) as { error?: string };
    if (json.error) return json.error;
  } catch {
    // not JSON — fall through
  }

  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

export async function masterApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const authHeaders = await getMasterAuthHeaders();
  const headers = new Headers(init?.headers);
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));

  return fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });
}
