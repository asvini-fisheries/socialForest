'use client';

import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectAreasTree } from '@/components/projects/project-areas-tree';
import { ProjectAreaActivitySummaryTable } from '@/components/projects/project-area-activity-summary';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  buildRolledUpSummariesByArea,
  type DailyActivityAreaRow,
} from '@/lib/project-activity-summaries';
import {
  TreePine,
  IndianRupee,
  Users,
  Activity,
  TrendingUp,
  MapPin,
  Loader2,
  Layers,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDailyActivities } from '@/lib/daily-activities-client';
import { createClient } from '@/lib/supabase/client';
import type { ProjectArea } from '@/types/database';

export default function DashboardPage() {
  const { user, selectedProject } = useAuth();
  const [areas, setAreas] = useState<ProjectArea[]>([]);
  const [activityEntries, setActivityEntries] = useState<DailyActivityAreaRow[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const loadActivityData = useCallback(async () => {
    if (!selectedProject?.id) {
      setAreas([]);
      setActivityEntries([]);
      return;
    }
    setLoadingActivities(true);
    const supabase = createClient();
    const [areasRes, activityRows] = await Promise.all([
      supabase
        .from('project_areas')
        .select('*')
        .eq('project_id', selectedProject.id)
        .eq('is_active', true)
        .order('level')
        .order('name'),
      fetchDailyActivities(selectedProject.id).catch(() => []),
    ]);

    setAreas((areasRes.data as ProjectArea[]) || []);
    setActivityEntries(activityRows as DailyActivityAreaRow[]);
    setLoadingActivities(false);
  }, [selectedProject?.id]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  const rolledUpSummaries = useMemo(
    () => buildRolledUpSummariesByArea(areas, activityEntries),
    [areas, activityEntries]
  );

  const stats = [
    {
      label: 'Trees Planned',
      value: formatNumber(selectedProject?.total_trees_planned || 0),
      icon: TreePine,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Land Area (Acres)',
      value: selectedProject?.total_land_area_acres?.toFixed(2) || '0',
      icon: MapPin,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Budget',
      value: formatCurrency(selectedProject?.budget_amount || 0),
      icon: IndianRupee,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Project Status',
      value: selectedProject?.status?.replace('_', ' ').toUpperCase() || 'N/A',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="text-gray-500 mt-1">Key metrics for the selected project</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedProject && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Project Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading project areas...
                  </div>
                ) : (
                  <ProjectAreasTree areas={areas} activitySummaries={rolledUpSummaries} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Activities by Project Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading summaries...
                  </div>
                ) : (
                  <ProjectAreaActivitySummaryTable areas={areas} entries={activityEntries} />
                )}
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Create User', href: '/masters/users' },
                  { label: 'New Project', href: '/projects/new' },
                  { label: 'Add Stakeholder', href: '/masters/stakeholders' },
                  { label: 'View Reports', href: '/reports' },
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="p-4 text-center rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-700">{action.label}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
