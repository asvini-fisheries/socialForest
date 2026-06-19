import { createClient } from '@/lib/supabase/client';
import type { Project, User } from '@/types/database';

export async function fetchProjectsForUser(
  user: User,
  yearId: string
): Promise<Project[]> {
  const supabase = createClient();

  let query = supabase
    .from('projects')
    .select(
      '*, year:years(*), csr_partner:csr_partners(name, code), organisation:organisations(name, code)'
    )
    .eq('year_id', yearId)
    .eq('is_active', true);

  if (user.role === 'csr_partner' && user.csr_partner_id) {
    query = query.eq('csr_partner_id', user.csr_partner_id);
  } else if (user.role === 'organisation' && user.organisation_id) {
    query = query.eq('organisation_id', user.organisation_id);
  } else if (user.role === 'stakeholder' && user.stakeholder_id) {
    const { data: allocations } = await supabase
      .from('activity_contractor_allocations')
      .select('project_activity_id, project_activities!inner(project_id)')
      .eq('stakeholder_id', user.stakeholder_id);

    const projectIds = [
      ...new Set(
        allocations?.map((a) => {
          const pa = a.project_activities as unknown as { project_id: string };
          return pa.project_id;
        }) || []
      ),
    ];

    if (projectIds.length === 0) return [];
    query = query.in('id', projectIds);
  }

  const { data, error } = await query.order('name');
  if (error) throw error;
  return (data as Project[]) || [];
}

export const PROJECT_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function formatProjectStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
