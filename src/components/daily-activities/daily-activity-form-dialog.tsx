'use client';

import { useEffect, useState } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import type { DailyActivityUpdate } from '@/types/database';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type ResourceRow = { resource_id: string; quantity_used: string; unit_rate: string };

type ActivityEntry = DailyActivityUpdate & {
  project_activity?: { activity_id?: string; activity?: { name: string } };
  resources_used?: { resource_id: string; quantity_used: number; unit_rate: number | null }[];
};

interface DailyActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ActivityEntry | null;
  onSaved: () => void;
}

export function DailyActivityFormDialog({
  open,
  onOpenChange,
  entry,
  onSaved,
}: DailyActivityFormDialogProps) {
  const { selectedProject } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<{ value: string; label: string }[]>([]);
  const [stakeholders, setStakeholders] = useState<{ value: string; label: string }[]>([]);
  const [areas, setAreas] = useState<{ value: string; label: string }[]>([]);
  const [resources, setResources] = useState<{ value: string; label: string }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    activity_id: '',
    stakeholder_id: '',
    project_area_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    quantity_completed: '',
    remarks: '',
  });
  const [resourceRows, setResourceRows] = useState<ResourceRow[]>([]);

  useEffect(() => {
    if (!open || !selectedProject) return;

    async function loadOptions() {
      const supabase = createClient();
      const [actRes, stkRes, areaRes, resRes] = await Promise.all([
        supabase.from('activities').select('id, name').eq('is_active', true).order('name'),
        supabase.from('stakeholders').select('id, name').eq('is_active', true).order('name'),
        supabase
          .from('project_areas')
          .select('id, name, level')
          .eq('project_id', selectedProject!.id)
          .eq('is_active', true)
          .order('level')
          .order('name'),
        supabase.from('resources_materials').select('id, name').eq('is_active', true).order('name'),
      ]);

      setActivities(actRes.data?.map((r) => ({ value: r.id, label: r.name })) || []);
      setStakeholders(stkRes.data?.map((r) => ({ value: r.id, label: r.name })) || []);
      setAreas([
        { value: '', label: '— Whole project —' },
        ...(areaRes.data?.map((r) => ({
          value: r.id,
          label: `${'  '.repeat((r.level as number) - 1)}${r.name}`,
        })) || []),
      ]);
      setResources(resRes.data?.map((r) => ({ value: r.id, label: r.name })) || []);
    }

    loadOptions();

    if (entry) {
      setForm({
        activity_id: entry.project_activity?.activity_id || '',
        stakeholder_id: entry.stakeholder_id,
        project_area_id: entry.project_area_id || '',
        activity_date: entry.activity_date,
        quantity_completed: entry.quantity_completed != null ? String(entry.quantity_completed) : '',
        remarks: entry.remarks || '',
      });
      setResourceRows(
        entry.resources_used?.map((r) => ({
          resource_id: r.resource_id,
          quantity_used: String(r.quantity_used),
          unit_rate: r.unit_rate != null ? String(r.unit_rate) : '',
        })) || []
      );
    } else {
      setForm({
        activity_id: '',
        stakeholder_id: '',
        project_area_id: '',
        activity_date: new Date().toISOString().split('T')[0],
        quantity_completed: '',
        remarks: '',
      });
      setResourceRows([]);
      setImageFile(null);
    }
    setError('');
  }, [open, entry, selectedProject]);

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
    if (!form.stakeholder_id) {
      setError('Select a stakeholder / contractor');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let imagePath: string | undefined;
      if (imageFile && selectedProject) {
        const supabase = createClient();
        const ext = imageFile.name.split('.').pop() || 'jpg';
        imagePath = `${selectedProject.id}/pending/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('activity-images')
          .upload(imagePath, imageFile, { upsert: false });
        if (uploadErr) throw new Error(uploadErr.message);
      }

      const resources_used = resourceRows
        .filter((r) => r.resource_id && r.quantity_used)
        .map((r) => ({
          resource_id: r.resource_id,
          quantity_used: Number(r.quantity_used),
          unit_rate: r.unit_rate ? Number(r.unit_rate) : undefined,
        }));

      const payload = {
        project_id: selectedProject.id,
        activity_id: form.activity_id,
        stakeholder_id: form.stakeholder_id,
        project_area_id: form.project_area_id || null,
        activity_date: form.activity_date,
        quantity_completed: form.quantity_completed ? Number(form.quantity_completed) : null,
        remarks: form.remarks || null,
        resources_used,
        image_path: imagePath,
        image_caption: form.remarks || null,
      };

      const res = entry
        ? await fetch(`/api/daily-activities/${entry.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/daily-activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save entry');

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent title={entry ? 'Edit Activity Entry' : 'New Activity Entry'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!entry && (
              <Select
                label="Activity"
                options={activities}
                value={form.activity_id}
                onChange={(e) => set('activity_id', e.target.value)}
                placeholder="Select activity"
                required
              />
            )}
            {entry && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Activity</label>
                <p className="text-sm text-gray-900 py-2">
                  {entry.project_activity?.activity?.name || '—'}
                </p>
              </div>
            )}
            <Select
              label="Stakeholder / Contractor"
              options={stakeholders}
              value={form.stakeholder_id}
              onChange={(e) => set('stakeholder_id', e.target.value)}
              placeholder="Select stakeholder"
              required
            />
            <Input
              label="Date"
              type="date"
              value={form.activity_date}
              onChange={(e) => set('activity_date', e.target.value)}
              required
            />
            <Input
              label="Quantity Completed"
              type="number"
              step="0.01"
              value={form.quantity_completed}
              onChange={(e) => set('quantity_completed', e.target.value)}
              placeholder="e.g. 5 acres, 100 trees"
            />
            <Select
              label="Project Area"
              options={areas}
              value={form.project_area_id}
              onChange={(e) => set('project_area_id', e.target.value)}
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

          {!entry && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Proof Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Resources Used (optional)</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setResourceRows((prev) => [...prev, { resource_id: '', quantity_used: '', unit_rate: '' }])
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
                        prev.map((r, i) => (i === idx ? { ...r, resource_id: e.target.value } : r))
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
                    value={row.quantity_used}
                    onChange={(e) =>
                      setResourceRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, quantity_used: e.target.value } : r))
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
                        prev.map((r, i) => (i === idx ? { ...r, unit_rate: e.target.value } : r))
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : entry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
