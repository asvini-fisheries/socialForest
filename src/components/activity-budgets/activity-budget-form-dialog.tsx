'use client';

import { useEffect, useMemo, useState } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { budgetAmount } from '@/lib/activity-budget-metrics';
import type { ActivityBudgetListRow } from '@/lib/activity-budget-display';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type ResourceRow = { resource_id: string; planned_quantity: string; unit_rate: string };

export type ActivityBudgetEntry = ActivityBudgetListRow;

interface ActivityBudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ActivityBudgetEntry | null;
  onSaved: () => void;
}

export function ActivityBudgetFormDialog({
  open,
  onOpenChange,
  entry,
  onSaved,
}: ActivityBudgetFormDialogProps) {
  const { selectedProject } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<{ value: string; label: string }[]>([]);
  const [areas, setAreas] = useState<{ value: string; label: string }[]>([]);
  const [resources, setResources] = useState<{ value: string; label: string }[]>([]);

  const [form, setForm] = useState({
    activity_id: '',
    project_area_id: '',
    planned_quantity: '',
    remarks: '',
  });
  const [resourceRows, setResourceRows] = useState<ResourceRow[]>([]);

  useEffect(() => {
    if (!open || !selectedProject) return;

    async function loadOptions() {
      const supabase = createClient();
      const [actRes, areaRes, resRes] = await Promise.all([
        supabase.from('activities').select('id, name').eq('is_active', true).order('name'),
        supabase
          .from('project_areas')
          .select('id, name, level')
          .eq('project_id', selectedProject!.id)
          .eq('is_active', true)
          .order('level')
          .order('name'),
        supabase.from('resources_materials').select('id, name').eq('is_active', true).order('name'),
      ]);

      setActivities(actRes.data?.map((row) => ({ value: row.id, label: row.name })) || []);
      setAreas([
        { value: '', label: '— Whole project —' },
        ...(areaRes.data?.map((row) => ({
          value: row.id,
          label: `${'  '.repeat((row.level as number) - 1)}${row.name}`,
        })) || []),
      ]);
      setResources(resRes.data?.map((row) => ({ value: row.id, label: row.name })) || []);
    }

    loadOptions();

    if (entry) {
      setForm({
        activity_id: entry.activity_id,
        project_area_id: entry.project_area_id || '',
        planned_quantity: entry.planned_quantity != null ? String(entry.planned_quantity) : '',
        remarks: entry.remarks || '',
      });
      setResourceRows(
        entry.resources?.map((row) => ({
          resource_id: row.resource_id,
          planned_quantity: String(row.planned_quantity),
          unit_rate: row.unit_rate != null ? String(row.unit_rate) : '',
        })) || []
      );
    } else {
      setForm({
        activity_id: '',
        project_area_id: '',
        planned_quantity: '',
        remarks: '',
      });
      setResourceRows([]);
    }
    setError('');
  }, [open, entry, selectedProject]);

  const totalAmount = useMemo(
    () =>
      budgetAmount({
        planned_quantity: form.planned_quantity ? Number(form.planned_quantity) : null,
        resources: resourceRows
          .filter((row) => row.resource_id && row.planned_quantity)
          .map((row) => ({
            planned_quantity: Number(row.planned_quantity),
            unit_rate: row.unit_rate ? Number(row.unit_rate) : 0,
          })),
      }),
    [form.planned_quantity, resourceRows]
  );

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) return;
    if (!form.activity_id && !entry) {
      setError('Select an activity');
      return;
    }
    if (resourceRows.filter((row) => row.resource_id && row.planned_quantity).length === 0) {
      setError('Add at least one resource with planned quantity');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const resourcesPayload = resourceRows
        .filter((row) => row.resource_id && row.planned_quantity)
        .map((row) => ({
          resource_id: row.resource_id,
          planned_quantity: Number(row.planned_quantity),
          unit_rate: row.unit_rate ? Number(row.unit_rate) : 0,
        }));

      const payload = {
        project_id: selectedProject.id,
        activity_id: form.activity_id,
        project_area_id: form.project_area_id || null,
        planned_quantity: form.planned_quantity ? Number(form.planned_quantity) : null,
        remarks: form.remarks || null,
        resources: resourcesPayload,
      };

      const res = entry
        ? await fetch(`/api/activity-budgets/${entry.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/activity-budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save budget');

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={entry ? 'Edit Activity Budget' : 'New Activity Budget'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!entry ? (
              <Select
                label="Activity"
                options={activities}
                value={form.activity_id}
                onChange={(e) => set('activity_id', e.target.value)}
                placeholder="Select activity"
                required
              />
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Activity</label>
                <p className="text-sm text-gray-900 py-2">{entry.activity?.name || '—'}</p>
              </div>
            )}
            <Select
              label="Project Area"
              options={areas}
              value={form.project_area_id}
              onChange={(e) => set('project_area_id', e.target.value)}
            />
            <Input
              label="Planned Quantity (optional)"
              type="number"
              step="0.01"
              value={form.planned_quantity}
              onChange={(e) => set('planned_quantity', e.target.value)}
              placeholder="Overall activity quantity"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Planned Resources</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setResourceRows((prev) => [
                    ...prev,
                    { resource_id: '', planned_quantity: '', unit_rate: '' },
                  ])
                }
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </Button>
            </div>
            {resourceRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Select
                    options={resources}
                    value={row.resource_id}
                    onChange={(e) =>
                      setResourceRows((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, resource_id: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Resource"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    value={row.planned_quantity}
                    onChange={(e) =>
                      setResourceRows((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, planned_quantity: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    value={row.unit_rate}
                    onChange={(e) =>
                      setResourceRows((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, unit_rate: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="col-span-1 text-red-600"
                  onClick={() => setResourceRows((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm">
            <span className="text-gray-600">Budget total from resources</span>
            <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : entry ? 'Update Budget' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
