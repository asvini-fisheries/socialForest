'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { ProjectAreasTree } from '@/components/projects/project-areas-tree';
import { ProjectAreaActivitySummaryTable } from '@/components/projects/project-area-activity-summary';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { Project, ProjectArea } from '@/types/database';
import type { DailyActivityAreaRow } from '@/lib/project-activity-summaries';
import {
  buildDirectSummariesByArea,
  buildRolledUpSummariesByArea,
} from '@/lib/project-activity-summaries';
import {
  ArrowLeft,
  TreePine,
  MapPin,
  IndianRupee,
  Handshake,
  Calendar,
  Loader2,
  Layers,
  Pencil,
  Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchDailyActivities } from '@/lib/daily-activities-client';
import { formatProjectStatus, PROJECT_STATUS_STYLES } from '@/lib/projects';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [project, setProject] = useState<Project | null>(null);
  const [areas, setAreas] = useState<ProjectArea[]>([]);
  const [activityEntries, setActivityEntries] = useState<DailyActivityAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    setActivityError('');
    const supabase = createClient();

    const [projectRes, areasRes] = await Promise.all([
      supabase
        .from('projects')
        .select(
          '*, year:years(year_label), csr_partner:csr_partners(name, code), organisation:organisations(name, code)'
        )
        .eq('id', id)
        .single(),
      supabase
        .from('project_areas')
        .select('*')
        .eq('project_id', id)
        .eq('is_active', true)
        .order('level')
        .order('name'),
    ]);

    if (projectRes.error) {
      setError(projectRes.error.message);
      setLoading(false);
      return;
    }

    let activityRows: DailyActivityAreaRow[] = [];
    try {
      activityRows = (await fetchDailyActivities(id)) as DailyActivityAreaRow[];
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : 'Failed to load activities');
    }

    setProject(projectRes.data as Project);
    setAreas((areasRes.data as ProjectArea[]) || []);
    setActivityEntries(activityRows);
    setLoading(false);
  }, [id]);

  const rolledUpSummaries = useMemo(
    () => buildRolledUpSummariesByArea(areas, activityEntries),
    [areas, activityEntries]
  );
  const directSummaries = useMemo(
    () => buildDirectSummariesByArea(areas, activityEntries),
    [areas, activityEntries]
  );

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading project...
          </div>
        ) : error || !project ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>{error || 'Project not found'}</p>
              <Link href="/projects" className="text-emerald-600 text-sm mt-2 inline-block">
                Return to projects
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {project.image_url && (
                  <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
                  </div>
                )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.draft
                    }`}
                  >
                    {formatProjectStatus(project.status)}
                  </span>
                </div>
                {project.code && <p className="text-gray-500 mt-1">{project.code}</p>}
                {project.description && (
                  <p className="text-gray-600 mt-2 max-w-2xl">{project.description}</p>
                )}
              </div>
              </div>
              {isAdmin && (
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="w-4 h-4" />
                  Edit Project
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Trees Planned', value: formatNumber(project.total_trees_planned), icon: TreePine, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Land Area', value: `${project.total_land_area_acres} acres`, icon: MapPin, color: 'text-blue-600 bg-blue-50' },
                { label: 'Budget', value: formatCurrency(project.budget_amount), icon: IndianRupee, color: 'text-amber-600 bg-amber-50' },
                { label: 'Financial Year', value: project.year?.year_label || '—', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-emerald-600" />
                    Partners
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">CSR Partner</p>
                    <p className="font-medium">{project.csr_partner?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Organisation</p>
                    <p className="font-medium">{project.organisation?.name}</p>
                  </div>
                  {project.location && (
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium">{project.location}</p>
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium">
                        {project.start_date ? formatDate(project.start_date) : '—'}
                        {' → '}
                        {project.end_date ? formatDate(project.end_date) : '—'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Project Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectAreasTree areas={areas} activitySummaries={rolledUpSummaries} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Activities by Project Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityError && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                    {activityError}
                  </div>
                )}
                <ProjectAreaActivitySummaryTable summaries={directSummaries} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {project && (
        <ProjectFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          project={project}
          onSaved={loadProject}
        />
      )}
    </DashboardLayout>
  );
}
