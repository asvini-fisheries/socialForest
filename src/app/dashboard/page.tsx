'use client';

import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { entryAmount, entryQuantity } from '@/lib/daily-activity-metrics';
import {
  buildDirectSummariesByArea,
  type DailyActivityAreaRow,
} from '@/lib/project-activity-summaries';
import { ProjectAreaActivitySummaryTable } from '@/components/projects/project-area-activity-summary';
import {
  TreePine,
  IndianRupee,
  Users,
  Activity,
  Receipt,
  TrendingUp,
  MapPin,
  Loader2,
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
        .eq('is_active', true),
      fetchDailyActivities(selectedProject.id).catch(() => []),
    ]);

    setAreas((areasRes.data as ProjectArea[]) || []);
    setActivityEntries(activityRows as DailyActivityAreaRow[]);
    setLoadingActivities(false);
  }, [selectedProject?.id]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  const activitySummaries = useMemo(
    () => buildDirectSummariesByArea(areas, activityEntries),
    [areas, activityEntries]
  );

  const recentEntries = useMemo(
    () =>
      [...activityEntries].sort((a, b) => {
        const dateA = (a as { activity_date?: string }).activity_date || '';
        const dateB = (b as { activity_date?: string }).activity_date || '';
        return dateB.localeCompare(dateA);
      }).slice(0, 5),
    [activityEntries]
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedProject ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Select a project to view activities</p>
                </div>
              ) : loadingActivities ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading activities...
                </div>
              ) : recentEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activities recorded</p>
                  <p className="text-sm mt-1">Activities will appear here once work begins</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry, idx) => {
                    const row = entry as DailyActivityAreaRow & {
                      activity_date?: string;
                      project_area?: { name?: string } | null;
                      project_activity?: { activity?: { name?: string } } | null;
                    };
                    return (
                      <div
                        key={String((row as { id?: string }).id ?? idx)}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {row.project_activity?.activity?.name || 'Activity'}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {row.activity_date ? formatDate(row.activity_date) : '—'}
                            {row.project_area?.name ? ` · ${row.project_area.name}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <p className="text-gray-900">{formatNumber(entryQuantity(row))}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(entryAmount(row))}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Pending Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending bills</p>
                <p className="text-sm mt-1">Bills will be generated from daily activity entries</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedProject && (
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
                <ProjectAreaActivitySummaryTable summaries={activitySummaries} />
              )}
            </CardContent>
          </Card>
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
