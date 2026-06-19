'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ModuleListPage, formatDate } from '@/components/modules/module-list-page';
import { TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CensusPage() {
  const { selectedProject } = useAuth();

  async function fetchCensus() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tree_census_updates')
      .select('*, project_area:project_areas(name)')
      .eq('project_id', selectedProject!.id)
      .order('census_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return (
    <ModuleListPage
      title="Tree Census"
      description="Periodic tree health status updates"
      icon={TreePine}
      emptyTitle="No census records yet"
      emptyDescription="Record tree health status project and sub-location wise with images"
      fetchData={fetchCensus}
      action={
        <Button disabled>
          <Plus className="w-4 h-4" />
          New Census
        </Button>
      }
      columns={[
        { key: 'date', header: 'Date', render: (r) => formatDate(r.census_date) },
        { key: 'area', header: 'Area', render: (r) => r.project_area?.name || 'All areas' },
        { key: 'total', header: 'Total', render: (r) => r.total_trees_counted },
        { key: 'healthy', header: 'Healthy', render: (r) => r.healthy_count },
        { key: 'stressed', header: 'Stressed', render: (r) => r.stressed_count },
        { key: 'dead', header: 'Dead', render: (r) => r.dead_count },
        { key: 'replaced', header: 'Replaced', render: (r) => r.replaced_count },
      ]}
    />
  );
}
