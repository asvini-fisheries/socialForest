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
import { formatNumber } from '@/lib/utils';
import { Sprout, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';

type StockRow = {
  resource_id: string;
  resource_name: string;
  resource_code: string | null;
  total_inward: number;
  total_issued: number;
  current_stock: number;
};

type Option = { value: string; label: string };

export default function NurseryPage() {
  const { user, selectedProject } = useAuth();
  const [stock, setStock] = useState<StockRow[]>([]);
  const [stakeholders, setStakeholders] = useState<Option[]>([]);
  const [species, setSpecies] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<'inward' | 'issue' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    stakeholder_id: '',
    resource_id: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    issue_category: 'plantation',
    remarks: '',
  });

  const loadData = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [stockRes, stakeholdersRes, speciesRes] = await Promise.all([
      supabase.from('nursery_stock').select('*').order('resource_name'),
      supabase.from('stakeholders').select('id, name, code').eq('is_active', true).order('name'),
      supabase
        .from('resources_materials')
        .select('id, name, code')
        .eq('is_tree_species', true)
        .eq('is_active', true)
        .order('name'),
    ]);

    if (stockRes.error) setError(stockRes.error.message);
    setStock((stockRes.data as StockRow[]) || []);
    setStakeholders(
      (stakeholdersRes.data || []).map((s) => ({
        value: s.id,
        label: s.code ? `${s.name} (${s.code})` : s.name,
      }))
    );
    setSpecies(
      (speciesRes.data || []).map((r) => ({
        value: r.id,
        label: r.code ? `${r.name} (${r.code})` : r.name,
      }))
    );
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openDialog(type: 'inward' | 'issue') {
    setError('');
    setForm({
      stakeholder_id: '',
      resource_id: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      issue_category: 'plantation',
      remarks: '',
    });
    setDialog(type);
  }

  async function handleSave() {
    if (!selectedProject || !user || !dialog) return;
    const qty = Number(form.quantity);
    if (dialog === 'inward' && !form.stakeholder_id) {
      setError('Stakeholder is required for inward entries');
      return;
    }
    if (!form.resource_id || !qty || qty <= 0) {
      setError('Species and a positive quantity are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/nursery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: selectedProject.id,
          type: dialog,
          stakeholder_id: form.stakeholder_id || undefined,
          resource_id: form.resource_id,
          quantity: qty,
          date: form.date,
          issue_category: form.issue_category,
          remarks: form.remarks || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setDialog(null);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
    }
    setSaving(false);
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Sprout}
          title="No project selected"
          description="Select a project to manage nursery stock"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centralized Nursery</h1>
            <p className="text-gray-500 mt-1">Manage tree stock — inwards, issues, and inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openDialog('inward')}>
              <ArrowDownToLine className="w-4 h-4" />
              Record Inward
            </Button>
            <Button onClick={() => openDialog('issue')}>
              <ArrowUpFromLine className="w-4 h-4" />
              Issue Stock
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Current Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading stock...
              </div>
            ) : stock.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No nursery stock yet"
                description="Record an inward entry to add tree species stock"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Species</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total Inward</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total Issued</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((row) => (
                      <tr key={row.resource_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {row.resource_name}
                          {row.resource_code && (
                            <span className="text-gray-400 ml-1">({row.resource_code})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.total_inward)}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.total_issued)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold">
                          {formatNumber(row.current_stock)}
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

      <DialogRoot open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent title={dialog === 'inward' ? 'Record Inward' : 'Issue Stock'}>
          <div className="space-y-4">
            {dialog === 'inward' && (
              <Select
                label="Stakeholder"
                value={form.stakeholder_id}
                onChange={(e) => setForm((f) => ({ ...f, stakeholder_id: e.target.value }))}
                placeholder="Select stakeholder"
                options={stakeholders}
              />
            )}
            <Select
              label="Tree Species"
              value={form.resource_id}
              onChange={(e) => setForm((f) => ({ ...f, resource_id: e.target.value }))}
              placeholder="Select species"
              options={species}
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
            <Input
              label={dialog === 'inward' ? 'Inward Date' : 'Issue Date'}
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
            {dialog === 'issue' && (
              <Select
                label="Issue Category"
                value={form.issue_category}
                onChange={(e) => setForm((f) => ({ ...f, issue_category: e.target.value }))}
                options={[
                  { value: 'plantation', label: 'Plantation' },
                  { value: 'replacement', label: 'Replacement' },
                ]}
              />
            )}
            <Input
              label="Remarks"
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialog(null)}>
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
