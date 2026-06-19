import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireProjectAccess(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  project_activity:project_activities(activity_id, activity:activities(name)),
  stakeholder:stakeholders(name),
  project_area:project_areas(name),
  images:daily_activity_images(id, image_url),
  resources_used:daily_activity_resources_used(id, resource_id, quantity_used, unit_rate, resource:resources_materials(name))
`;
