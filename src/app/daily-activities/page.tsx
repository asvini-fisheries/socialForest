'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DailyActivityFormDialog } from '@/components/daily-activities/daily-activity-form-dialog';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
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
  resources_used?: { id: string; resource_id: string; quantity_used: number; unit_rate: number | null }[];
};

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
    const supabase = createClient();

    const { data, error: err } = await supabase
      .from('daily_activity_updates')
      .select(
        `*,
        project_activity:project_activities(activity_id, activity:activities(name)),
        stakeholder:stakeholders(name),
        project_area:project_areas(name),
        images:daily_activity_images(id, image_url),
        resources_used:daily_activity_resources_used(id, resource_id, quantity_used, unit_rate, resource:resources_materials(name))`
      )
      .eq('project_id', selectedProject.id)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (err) {
      if (err.message.includes('policy') || err.code === '42501') {
        setError(
          'Database permissions not set up. Run migration 011_daily_activities_policies.sql in Supabase SQL Editor.'
        );
      } else {
        setError(err.message);
      }
      setEntries([]);
    } else {
      setEntries((data as ActivityEntry[]) || []);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const todayEntries = entries.filter((e) => e.activity_date === today);
  const imageCount = entries.reduce((sum, e) => sum + (e.images?.length || 0), 0);
  const resourceCount = entries.reduce((sum, e) => sum + (e.resources_used?.length || 0), 0);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: ActivityEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  async function handleDelete(entry: ActivityEntry) {
    if (!confirm('Delete this activity entry?')) return;
    const supabase = createClient();
    const { error: err } = await supabase.from('daily_activity_updates').delete().eq('id', entry.id);
    if (err) setError(err.message);
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
            <p className="text-gray-500 mt-1">
              {selectedProject.name} — record work progress with proof images
            </p>
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
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-start justify-between gap-3 p-4 rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {entry.project_activity?.activity?.name || 'Activity'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(entry.activity_date)}
                        {entry.stakeholder?.name ? ` · ${entry.stakeholder.name}` : ''}
                        {entry.project_area?.name ? ` · ${entry.project_area.name}` : ''}
                      </p>
                      {entry.quantity_completed != null && (
                        <p className="text-sm text-emerald-700">
                          Qty: {formatNumber(entry.quantity_completed)}
                        </p>
                      )}
                      {entry.remarks && <p className="text-sm text-gray-600">{entry.remarks}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(entry.images?.length || 0) > 0 && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {entry.images!.length} image{entry.images!.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {(entry.resources_used?.length || 0) > 0 && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            {entry.resources_used!.length} resource{entry.resources_used!.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
                  </div>
                ))}
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
