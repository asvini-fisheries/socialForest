'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { fetchProjectsForUser, formatProjectStatus, PROJECT_STATUS_STYLES } from '@/lib/projects';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Project } from '@/types/database';
import {
  FolderKanban,
  Plus,
  MapPin,
  TreePine,
  IndianRupee,
  Building2,
  Handshake,
  Loader2,
  ChevronRight,
} from 'lucide-react';

export default function ProjectsPage() {
  const { user, selectedYear } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !selectedYear) return;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProjectsForUser(user!, selectedYear!.id);
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, selectedYear]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">
              {selectedYear?.year_label} — {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          {user?.role === 'admin' && (
            <Link href="/projects/new">
              <Button>
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-gray-600">No projects found</p>
              <p className="text-sm mt-1">
                {user?.role === 'admin'
                  ? 'Create a new project to get started'
                  : 'No projects are linked to your account for this year'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.code && (
                          <p className="text-sm text-gray-500 mt-0.5">{project.code}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                          PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.draft
                        }`}
                      >
                        {formatProjectStatus(project.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <TreePine className="w-4 h-4 text-emerald-600" />
                        <span>{formatNumber(project.total_trees_planned)} trees</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{project.total_land_area_acres} acres</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <IndianRupee className="w-4 h-4 text-amber-600" />
                        <span>{formatCurrency(project.budget_amount)}</span>
                      </div>
                      {project.location && (
                        <div className="flex items-center gap-2 text-gray-600 col-span-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Handshake className="w-3.5 h-3.5" />
                          {project.csr_partner?.name || 'CSR Partner'}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Building2 className="w-3.5 h-3.5" />
                          {project.organisation?.name || 'Organisation'}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
