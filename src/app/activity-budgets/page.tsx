'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ExcelExportButton } from '@/components/export/excel-export-button';
import {
  ActivityBudgetFormDialog,
  type ActivityBudgetEntry,
} from '@/components/activity-budgets/activity-budget-form-dialog';
import { useAuth } from '@/contexts/auth-context';
import { budgetAmount } from '@/lib/activity-budget-metrics';
import {
  buildAreaSortIndex,
  budgetParentAreaText,
  budgetProjectAreaText,
  EMPTY_ACTIVITY_BUDGET_FILTERS,
  filterActivityBudgetRows,
  hasActiveBudgetFilters,
  sortActivityBudgetRows,
  type ActivityBudgetFilters,
} from '@/lib/activity-budget-display';
import {
  ACTIVITY_BUDGET_EXPORT_COLUMNS,
  flattenActivityBudgetsForExport,
} from '@/lib/activity-budget-excel';
import {
  deleteActivityBudget,
  downloadActivityBudgetTemplate,
  fetchActivityBudgets,
  importActivityBudgets,
} from '@/lib/activity-budgets-client';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ProjectArea } from '@/types/database';
import { FileSpreadsheet, IndianRupee, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';

export default function ActivityBudgetsPage() {
  const { selectedProject } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ActivityBudgetEntry[]>([]);
  const [areas, setAreas] = useState<ProjectArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState('');
  const [filters, setFilters] = useState<ActivityBudgetFilters>(EMPTY_ACTIVITY_BUDGET_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityBudgetEntry | null>(null);

  const loadBudgets = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const [data, areasRes] = await Promise.all([
        fetchActivityBudgets(selectedProject.id),
        supabase
          .from('project_areas')
          .select('*')
          .eq('project_id', selectedProject.id)
          .eq('is_active', true)
          .order('level')
          .order('name'),
      ]);
      setRows(data);
      setAreas((areasRes.data as ProjectArea[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
      setRows([]);
      setAreas([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const areaOrder = useMemo(() => buildAreaSortIndex(areas), [areas]);

  const enrichedRows = useMemo(() => {
    const areaById = new Map(areas.map((area) => [area.id, area]));
    return rows.map((row) => {
      if (!row.project_area_id) return row;
      const area = areaById.get(row.project_area_id);
      if (!area) return row;
      const parent = area.parent_area_id ? areaById.get(area.parent_area_id) : null;
      return {
        ...row,
        project_area: {
          ...row.project_area,
          id: area.id,
          name: area.name,
          code: area.code,
          level: area.level,
          parent_area_id: area.parent_area_id,
          parent_area: parent
            ? { name: parent.name, code: parent.code }
            : row.project_area?.parent_area || null,
        },
      };
    });
  }, [rows, areas]);

  const filteredRows = useMemo(
    () => filterActivityBudgetRows(enrichedRows, filters),
    [enrichedRows, filters]
  );

  const sortedRows = useMemo(
    () => sortActivityBudgetRows(filteredRows, areaOrder),
    [filteredRows, areaOrder]
  );

  const totalBudget = useMemo(
    () => filteredRows.reduce((sum, row) => sum + budgetAmount(row), 0),
    [filteredRows]
  );
  const exportRows = useMemo(() => flattenActivityBudgetsForExport(sortedRows), [sortedRows]);

  function setFilter<K extends keyof ActivityBudgetFilters>(key: K, value: ActivityBudgetFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDelete(row: ActivityBudgetEntry) {
    if (!selectedProject) return;
    if (!window.confirm('Delete this activity budget?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteActivityBudget(selectedProject.id, row.id);
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  }

  async function handleTemplateDownload() {
    if (!selectedProject) return;
    setBusy('template');
    setError('');
    setSuccess('');
    try {
      await downloadActivityBudgetTemplate(selectedProject.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Template download failed');
    }
    setBusy('');
  }

  async function handleUpload(file: File) {
    if (!selectedProject) return;
    setBusy('upload');
    setError('');
    setSuccess('');
    try {
      const result = await importActivityBudgets(selectedProject.id, file);
      if (result.errorCount > 0) {
        const firstError = result.errors[0];
        setError(
          `Imported ${result.successCount} resource line(s) with ${result.errorCount} error(s).` +
            (firstError ? ` Row ${firstError.row}: ${firstError.message}` : '')
        );
      } else {
        setSuccess(`Successfully imported ${result.successCount} resource line(s).`);
      }
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    setBusy('');
    if (fileRef.current) fileRef.current.value = '';
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-500">Select a project from the header</div>
      </DashboardLayout>
    );
  }

  const filtersActive = hasActiveBudgetFilters(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Budgets</h1>
            <p className="text-gray-500 mt-1">
              Plan budgets by project area and activity with resource line items
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExcelExportButton
              sheetName="Activity Budgets"
              filename="activity_budgets.xlsx"
              columns={ACTIVITY_BUDGET_EXPORT_COLUMNS}
              rows={exportRows}
              disabled={loading || exportRows.length === 0}
            />
            <Button variant="outline" onClick={handleTemplateDownload} disabled={!!busy}>
              {busy === 'template' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Upload Format
            </Button>
            <Button variant="outline" disabled={!!busy} onClick={() => fileRef.current?.click()}>
              {busy === 'upload' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Excel Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Budget
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
            {success}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-amber-600" />
              Planned Budgets
              <span className="text-sm font-normal text-gray-400">
                ({sortedRows.length}
                {filtersActive ? ` of ${rows.length}` : ''})
              </span>
            </CardTitle>
            <p className="text-sm font-semibold text-gray-900">Total: {formatCurrency(totalBudget)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label="Search"
                placeholder="Search all fields…"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
              <Input
                label="Parent Area"
                placeholder="Filter by parent area…"
                value={filters.parentArea}
                onChange={(e) => setFilter('parentArea', e.target.value)}
              />
              <Input
                label="Project Area"
                placeholder="Filter by project area…"
                value={filters.projectArea}
                onChange={(e) => setFilter('projectArea', e.target.value)}
              />
              <Input
                label="Activity"
                placeholder="Filter by activity…"
                value={filters.activity}
                onChange={(e) => setFilter('activity', e.target.value)}
              />
            </div>

            {filtersActive && (
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setFilters(EMPTY_ACTIVITY_BUDGET_FILTERS)}>
                  Clear filters
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={IndianRupee}
                title="No activity budgets yet"
                description="Create budgets manually, or download the upload format and import from Excel"
              />
            ) : sortedRows.length === 0 ? (
              <EmptyState
                icon={IndianRupee}
                title="No matching budgets"
                description="Try adjusting the search or filters above"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Parent Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Activity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Resources</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Planned Qty</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Budget</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => {
                      const resourceLabel = (row.resources || [])
                        .map(
                          (item) =>
                            `${item.resource?.name || 'Resource'}: ${formatNumber(item.planned_quantity)} @ ${formatCurrency(item.unit_rate || 0)}`
                        )
                        .join('; ');
                      return (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600">{budgetParentAreaText(row)}</td>
                          <td className="py-3 px-4 text-gray-700 font-medium">
                            {budgetProjectAreaText(row)}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {row.activity?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-md truncate" title={resourceLabel}>
                            {resourceLabel || '—'}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            {row.planned_quantity != null ? formatNumber(row.planned_quantity) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-medium">
                            {formatCurrency(budgetAmount(row))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(row);
                                  setDialogOpen(true);
                                }}
                                className="text-emerald-600 hover:text-emerald-700"
                                aria-label="Edit budget"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row)}
                                className="text-red-600 hover:text-red-700"
                                aria-label="Delete budget"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityBudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        onSaved={loadBudgets}
      />
    </DashboardLayout>
  );
}
