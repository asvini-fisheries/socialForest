'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DailyActivityFormDialog } from '@/components/daily-activities/daily-activity-form-dialog';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, formatNumber } from '@/lib/utils';
import type { DailyActivityUpdate } from '@/types/database';
import { Plus, Activity, Camera, Package, Loader2, Pencil, Trash2 } from 'lucide-react';

type ActivityEntry = DailyActivityUpdate & {
  project_activity?: {
    activity_id?: string;
    activity?: { name: string };
  };
  stakeholder?: { name: string };
  project_area?: { name: string } | null;
  images?: { id: string; image_url: string }[];
  resources_used?: {
    id: string;
    resource_id: string;
    quantity_used: number;
    unit_rate: number | null;
    resource?: { name: string };
  }[];
};

function activityAmount(entry: ActivityEntry): string {
  if (entry.quantity_completed != null) {
    return formatNumber(entry.quantity_completed);
  }
  return '—';
}

export default function DailyActivitiesPage() {
  const { selectedProject } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityEntry | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const loadEntries = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/daily-activities?project_id=${selectedProject.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load entries');
      setEntries(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
      setEntries([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const todayEntries = entries.filter((e) => e.activity_date === today);
  const imageCount = entries.reduce((sum, e) => sum + (e.images?.length || 0), 0);
  const resourceCount = entries.reduce((sum, e) => sum + (e.resources_used?.length || 0), 0);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const dateCmp = b.activity_date.localeCompare(a.activity_date);
        if (dateCmp !== 0) return dateCmp;
        const areaA = a.project_area?.name || '';
        const areaB = b.project_area?.name || '';
        const areaCmp = areaA.localeCompare(areaB);
        if (areaCmp !== 0) return areaCmp;
        const actA = a.project_activity?.activity?.name || '';
        const actB = b.project_activity?.activity?.name || '';
        return actA.localeCompare(actB);
      }),
    [entries]
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: ActivityEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  async function handleDelete(entry: ActivityEntry) {
    if (!selectedProject || !confirm('Delete this activity entry?')) return;
    const res = await fetch(
      `/api/daily-activities/${entry.id}?project_id=${selectedProject.id}`,
      { method: 'DELETE' }
    );
    const json = await res.json();
    if (!res.ok) setError(json.error || 'Delete failed');
    else await loadEntries();
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Activity}
          title="No project selected"
          description="Select a project from the dashboard to record daily activities"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Activities</h1>
            <p className="text-gray-500 mt-1">Record work progress with proof images</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Entry
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Entries</p>
                <p className="text-2xl font-bold">{todayEntries.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Proof Images</p>
                <p className="text-2xl font-bold">{imageCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resources Used</p>
                <p className="text-2xl font-bold">{resourceCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading entries...
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No daily activities recorded yet"
                description="Click New Entry to record work progress with images and resource usage"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-3 pr-4 font-medium">Date</th>
                      <th className="py-3 pr-4 font-medium">Project Area</th>
                      <th className="py-3 pr-4 font-medium">Activity</th>
                      <th className="py-3 pr-4 font-medium text-right">Amount</th>
                      <th className="py-3 font-medium text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 hover:bg-gray-50/80"
                      >
                        <td className="py-3 pr-4 text-gray-900 whitespace-nowrap">
                          {formatDate(entry.activity_date)}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {entry.project_area?.name || '—'}
                        </td>
                        <td className="py-3 pr-4 text-gray-900 font-medium">
                          {entry.project_activity?.activity?.name || '—'}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-900 tabular-nums">
                          {activityAmount(entry)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(entry)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DailyActivityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        onSaved={loadEntries}
      />
    </DashboardLayout>
  );
}
