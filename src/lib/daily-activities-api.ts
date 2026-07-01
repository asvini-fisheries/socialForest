import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing from server .env.local — add it from Supabase → Settings → API → service_role'
    );
  }
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
    if (payload.role !== 'service_role') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the service_role secret, not the anon key');
    }
  } catch {
    // ignore decode errors for non-JWT keys
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireProjectAccess(projectId: string, request?: NextRequest) {
  const supabase = await createClient();
  let user = null;

  const bearer = request?.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    const { data, error } = await supabase.auth.getUser(bearer.slice(7));
    if (!error && data.user) user = data.user;
  }

  if (!user) {
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser();
    user = cookieUser;
  }

  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'User profile not found', status: 403 as const };

  if (profile.role === 'admin') return { user, role: profile.role };

  const { data: project } = await getServiceClient()
    .from('projects')
    .select('id, organisation_id')
    .eq('id', projectId)
    .single();

  if (!project) return { error: 'Project not found', status: 404 as const };

  return { user, role: profile.role, project };
}

export const ACTIVITY_SELECT = `
  *,
  project_activity:project_activities(activity_id, activity:activities(name, code)),
  stakeholder:stakeholders(name),
  project_area:project_areas(name, code, parent_area:parent_area_id(name, code)),
  images:daily_activity_images(id, image_url),
  resources_used:daily_activity_resources_used(id, resource_id, quantity_used, unit_rate, resource:resources_materials(name, is_tree_species))
`;
