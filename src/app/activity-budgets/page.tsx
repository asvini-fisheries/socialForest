'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ActivityBudgetFormDialog,
  type ActivityBudgetEntry,
} from '@/components/activity-budgets/activity-budget-form-dialog';
import { useAuth } from '@/contexts/auth-context';
import { budgetAmount } from '@/lib/activity-budget-metrics';
import { deleteActivityBudget, fetchActivityBudgets } from '@/lib/activity-budgets-client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { IndianRupee, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

export default function ActivityBudgetsPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<ActivityBudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityBudgetEntry | null>(null);

  const loadBudgets = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchActivityBudgets(selectedProject.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const totalBudget = useMemo(() => rows.reduce((sum, row) => sum + budgetAmount(row), 0), [rows]);

  async function handleDelete(row: ActivityBudgetEntry) {
    if (!selectedProject) return;
    if (!window.confirm('Delete this activity budget?')) return;
    setError('');
    try {
      await deleteActivityBudget(selectedProject.id, row.id);
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete budget');
    }
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-500">Select a project from the header</div>
      </DashboardLayout>
    );
  }

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

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-amber-600" />
              Planned Budgets
            </CardTitle>
            <p className="text-sm font-semibold text-gray-900">Total: {formatCurrency(totalBudget)}</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={IndianRupee}
                title="No activity budgets yet"
                description="Create area-wise and activity-wise budgets with planned resources"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Activity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Resources</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Planned Qty</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Budget</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const resourceLabel = (row.resources || [])
                        .map(
                          (item) =>
                            `${item.resource?.name || 'Resource'}: ${formatNumber(item.planned_quantity)} @ ${formatCurrency(item.unit_rate || 0)}`
                        )
                        .join('; ');
                      return (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700">
                            {row.project_area?.name || 'Whole project'}
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
