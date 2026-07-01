'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { TreePine, Plus, Loader2 } from 'lucide-react';

type CensusRow = {
  id: string;
  census_date: string;
  total_trees_counted: number;
  healthy_count: number;
  stressed_count: number;
  dead_count: number;
  replaced_count: number;
  project_area?: { name?: string } | null;
};

type AreaOption = { value: string; label: string };

export default function CensusPage() {
  const { user, selectedProject } = useAuth();
  const [rows, setRows] = useState<CensusRow[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    census_date: new Date().toISOString().split('T')[0],
    project_area_id: '',
    total_trees_counted: '',
    healthy_count: '0',
    stressed_count: '0',
    dead_count: '0',
    replaced_count: '0',
    remarks: '',
  });

  const loadData = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [censusRes, areasRes] = await Promise.all([
      supabase
        .from('tree_census_updates')
        .select('*, project_area:project_areas(name)')
        .eq('project_id', selectedProject.id)
        .order('census_date', { ascending: false }),
      supabase
        .from('project_areas')
        .select('id, name, code')
        .eq('project_id', selectedProject.id)
        .eq('is_active', true)
        .order('name'),
    ]);

    if (censusRes.error) setError(censusRes.error.message);
    setRows((censusRes.data as CensusRow[]) || []);
    setAreas(
      (areasRes.data || []).map((a) => ({
        value: a.id,
        label: a.code ? `${a.name} (${a.code})` : a.name,
      }))
    );
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    if (!selectedProject || !user) return;
    const total = Number(form.total_trees_counted);
    if (!form.census_date || !total || total <= 0) {
      setError('Census date and total trees counted are required');
      return;
    }

    setSaving(true);
    setError('');
    const supabase = createClient();
    const { error: saveError } = await supabase.from('tree_census_updates').insert({
      project_id: selectedProject.id,
      project_area_id: form.project_area_id || null,
      census_date: form.census_date,
      total_trees_counted: total,
      healthy_count: Number(form.healthy_count) || 0,
      stressed_count: Number(form.stressed_count) || 0,
      dead_count: Number(form.dead_count) || 0,
      replaced_count: Number(form.replaced_count) || 0,
      remarks: form.remarks || null,
      recorded_by: user.id,
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      setDialogOpen(false);
      await loadData();
    }
    setSaving(false);
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={TreePine}
          title="No project selected"
          description="Select a project to record tree census updates"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tree Census</h1>
            <p className="text-gray-500 mt-1">Periodic tree health status updates</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            New Census
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-emerald-600" />
              Census Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading census records...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={TreePine}
                title="No census records yet"
                description="Click New Census to record tree health status"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Area</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Healthy</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Stressed</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Dead</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Replaced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(r.census_date)}</td>
                        <td className="py-3 px-4">{r.project_area?.name || 'All areas'}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{r.total_trees_counted}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{r.healthy_count}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{r.stressed_count}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{r.dead_count}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{r.replaced_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent title="New Tree Census">
          <div className="space-y-4">
            <Input
              label="Census Date"
              type="date"
              value={form.census_date}
              onChange={(e) => setForm((f) => ({ ...f, census_date: e.target.value }))}
              required
            />
            <Select
              label="Project Area"
              value={form.project_area_id}
              onChange={(e) => setForm((f) => ({ ...f, project_area_id: e.target.value }))}
              placeholder="All areas / not specified"
              options={areas}
            />
            <Input
              label="Total Trees Counted"
              type="number"
              min="1"
              value={form.total_trees_counted}
              onChange={(e) => setForm((f) => ({ ...f, total_trees_counted: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Healthy"
                type="number"
                min="0"
                value={form.healthy_count}
                onChange={(e) => setForm((f) => ({ ...f, healthy_count: e.target.value }))}
              />
              <Input
                label="Stressed"
                type="number"
                min="0"
                value={form.stressed_count}
                onChange={(e) => setForm((f) => ({ ...f, stressed_count: e.target.value }))}
              />
              <Input
                label="Dead"
                type="number"
                min="0"
                value={form.dead_count}
                onChange={(e) => setForm((f) => ({ ...f, dead_count: e.target.value }))}
              />
              <Input
                label="Replaced"
                type="number"
                min="0"
                value={form.replaced_count}
                onChange={(e) => setForm((f) => ({ ...f, replaced_count: e.target.value }))}
              />
            </div>
            <Input
              label="Remarks"
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogRoot>
    </DashboardLayout>
  );
}
