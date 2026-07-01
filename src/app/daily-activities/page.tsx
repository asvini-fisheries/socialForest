'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ExcelExportButton } from '@/components/export/excel-export-button';
import { DailyActivityFormDialog } from '@/components/daily-activities/daily-activity-form-dialog';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { entryAmount, entryQuantity } from '@/lib/daily-activity-metrics';
import { fetchDailyActivities } from '@/lib/daily-activities-client';
import { formatAreaRef } from '@/lib/master-display';
import type { DailyActivityUpdate } from '@/types/database';
import { Plus, Activity, Loader2, Pencil, Trash2 } from 'lucide-react';

type ActivityEntry = DailyActivityUpdate & {
  project_activity?: {
    activity_id?: string;
    activity?: { name: string };
  };
  stakeholder?: { name: string };
  project_area?: {
    name: string;
    code?: string | null;
    parent_area?: { name: string; code?: string | null } | null;
  } | null;
  images?: { id: string; image_url: string }[];
  resources_used?: {
    id: string;
    resource_id: string;
    quantity_used: number;
    unit_rate: number | null;
    resource?: { name: string };
  }[];
};

type ActivityFilters = {
  dateFrom: string;
  dateTo: string;
  parentArea: string;
  projectArea: string;
  activity: string;
  stakeholder: string;
};

const EMPTY_FILTERS: ActivityFilters = {
  dateFrom: '',
  dateTo: '',
  parentArea: '',
  projectArea: '',
  activity: '',
  stakeholder: '',
};

const EXPORT_COLUMNS = [
  { key: 'activity_date', header: 'Date' },
  { key: 'parent_area', header: 'Parent Area' },
  { key: 'project_area', header: 'Project Area' },
  { key: 'activity', header: 'Activity' },
  { key: 'stakeholder', header: 'Stakeholder' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'amount', header: 'Amount' },
  { key: 'remarks', header: 'Remarks' },
];

function entryParentAreaText(entry: ActivityEntry): string {
  return formatAreaRef(entry.project_area?.parent_area) || '';
}

function hasActiveFilters(filters: ActivityFilters): boolean {
  return Object.values(filters).some((v) => v.trim() !== '');
}

function toExportRow(entry: ActivityEntry): Record<string, unknown> {
  return {
    activity_date: formatDate(entry.activity_date),
    parent_area: entryParentAreaText(entry),
    project_area: entry.project_area?.name || '',
    activity: entry.project_activity?.activity?.name || '',
    stakeholder: entry.stakeholder?.name || '',
    quantity: entryQuantity(entry) || '',
    amount: entryAmount(entry) || '',
    remarks: entry.remarks || '',
  };
}

export default function DailyActivitiesPage() {
  const { selectedProject } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityEntry | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(EMPTY_FILTERS);

  const loadEntries = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');

    try {
      const data = await fetchDailyActivities(selectedProject.id);
      setEntries(data as ActivityEntry[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
      setEntries([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const parentQ = filters.parentArea.trim().toLowerCase();
    const areaQ = filters.projectArea.trim().toLowerCase();
    const activityQ = filters.activity.trim().toLowerCase();
    const stakeholderQ = filters.stakeholder.trim().toLowerCase();

    return entries.filter((entry) => {
      if (filters.dateFrom && entry.activity_date < filters.dateFrom) return false;
      if (filters.dateTo && entry.activity_date > filters.dateTo) return false;

      if (parentQ) {
        const parentText = entryParentAreaText(entry).toLowerCase();
        if (!parentText.includes(parentQ)) return false;
      }

      if (areaQ) {
        const areaName = entry.project_area?.name?.toLowerCase() || '';
        const areaCode = entry.project_area?.code?.toLowerCase() || '';
        if (!areaName.includes(areaQ) && !areaCode.includes(areaQ)) return false;
      }

      if (activityQ) {
        const activityName = entry.project_activity?.activity?.name?.toLowerCase() || '';
        if (!activityName.includes(activityQ)) return false;
      }

      if (stakeholderQ) {
        const stakeholderName = entry.stakeholder?.name?.toLowerCase() || '';
        if (!stakeholderName.includes(stakeholderQ)) return false;
      }

      return true;
    });
  }, [entries, filters]);

  const sortedEntries = useMemo(
    () =>
      [...filteredEntries].sort((a, b) => {
        const dateCmp = b.activity_date.localeCompare(a.activity_date);
        if (dateCmp !== 0) return dateCmp;
        const parentCmp = entryParentAreaText(a).localeCompare(entryParentAreaText(b));
        if (parentCmp !== 0) return parentCmp;
        const areaA = a.project_area?.name || '';
        const areaB = b.project_area?.name || '';
        const areaCmp = areaA.localeCompare(areaB);
        if (areaCmp !== 0) return areaCmp;
        const actA = a.project_activity?.activity?.name || '';
        const actB = b.project_activity?.activity?.name || '';
        return actA.localeCompare(actB);
      }),
    [filteredEntries]
  );

  const totals = useMemo(
    () => ({
      entries: filteredEntries.length,
      quantity: filteredEntries.reduce((sum, e) => sum + entryQuantity(e), 0),
      amount: filteredEntries.reduce((sum, e) => sum + entryAmount(e), 0),
    }),
    [filteredEntries]
  );

  const exportRows = useMemo(
    () => sortedEntries.map(toExportRow),
    [sortedEntries]
  );

  function setFilter<K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

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

  const filtersActive = hasActiveFilters(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Activities</h1>
            <p className="text-gray-500 mt-1">Record work progress with proof images</p>
          </div>
          <div className="flex items-center gap-2">
            <ExcelExportButton
              sheetName="Daily Activities"
              filename="daily_activities.xlsx"
              columns={EXPORT_COLUMNS}
              rows={exportRows}
              disabled={loading || sortedEntries.length === 0}
            />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Activity Entries
              <span className="text-sm font-normal text-gray-400">
                ({totals.entries}
                {filtersActive ? ` of ${entries.length}` : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <Input
                label="Date from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
              <Input
                label="Date to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
              <Input
                label="Parent Area"
                placeholder="Filter by parent…"
                value={filters.parentArea}
                onChange={(e) => setFilter('parentArea', e.target.value)}
              />
              <Input
                label="Project Area"
                placeholder="Filter by area…"
                value={filters.projectArea}
                onChange={(e) => setFilter('projectArea', e.target.value)}
              />
              <Input
                label="Activity"
                placeholder="Filter by activity…"
                value={filters.activity}
                onChange={(e) => setFilter('activity', e.target.value)}
              />
              <Input
                label="Stakeholder"
                placeholder="Filter by stakeholder…"
                value={filters.stakeholder}
                onChange={(e) => setFilter('stakeholder', e.target.value)}
              />
            </div>

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
            ) : sortedEntries.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No matching entries"
                description="Try adjusting the filters above"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Parent Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Activity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Stakeholder</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Quantity</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry) => {
                      const qty = entryQuantity(entry);
                      const amt = entryAmount(entry);
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-gray-900 whitespace-nowrap">
                            {formatDate(entry.activity_date)}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {entryParentAreaText(entry) || '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {entry.project_area?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            <p className="font-medium">{entry.project_activity?.activity?.name || '—'}</p>
                            {entry.remarks && (
                              <p className="text-xs text-gray-500 mt-0.5">{entry.remarks}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {entry.stakeholder?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 tabular-nums">
                            {qty ? formatNumber(qty) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 tabular-nums">
                            {amt ? formatCurrency(amt) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
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
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td className="py-3 px-4 text-gray-900" colSpan={5}>
                        Totals ({formatNumber(totals.entries)} entries)
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 tabular-nums">
                        {formatNumber(totals.quantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 tabular-nums">
                        {formatCurrency(totals.amount)}
                      </td>
                      <td className="py-3 px-4" />
                    </tr>
                  </tfoot>
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
