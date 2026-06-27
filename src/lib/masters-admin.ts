import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { MasterTableSpec } from '@/lib/master-registry-data';

const IMAGE_FIELDS = ['image_url', 'logo_url', 'avatar_url', 'file_url'];

export async function requireMasterAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 as const };
  }

  return { user };
}

export function getMasterServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function allowedPersistKeys(spec: MasterTableSpec): Set<string> {
  const keys = spec.importColumns.filter((c) => !c.importOnly).map((c) => c.key);
  return new Set([...keys, ...IMAGE_FIELDS]);
}

export function sanitizeMasterPayload(
  spec: MasterTableSpec,
  body: Record<string, unknown>,
  mode: 'insert' | 'update'
): Record<string, unknown> {
  const allowed = allowedPersistKeys(spec);
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
    if (!allowed.has(key)) continue;
    payload[key] = value === '' ? null : value;
  }

  if (mode === 'insert' && payload.is_active === undefined && allowed.has('is_active')) {
    payload.is_active = true;
  }

  return payload;
}

export function usesSoftDelete(spec: MasterTableSpec, table: string): boolean {
  return table !== 'project_user_access' && spec.importColumns.some((c) => c.key === 'is_active');
}
