'use client';

import { useEffect, useState } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import type { Project, ProjectStatus } from '@/types/database';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSaved: () => void;
}

export function ProjectFormDialog({ open, onOpenChange, project, onSaved }: ProjectFormDialogProps) {
  const { user, selectedYear } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [years, setYears] = useState<{ value: string; label: string }[]>([]);
  const [csrPartners, setCsrPartners] = useState<{ value: string; label: string }[]>([]);
  const [organisations, setOrganisations] = useState<{ value: string; label: string }[]>([]);

  const [form, setForm] = useState({
    year_id: '',
    csr_partner_id: '',
    organisation_id: '',
    name: '',
    code: '',
    description: '',
    total_land_area_acres: '',
    total_trees_planned: '',
    budget_amount: '',
    status: 'draft' as ProjectStatus,
    start_date: '',
    end_date: '',
    location: '',
    district: '',
    state: '',
    is_active: true,
  });

  useEffect(() => {
    if (!open) return;
    async function loadOptions() {
      const supabase = createClient();
      const [y, c, o] = await Promise.all([
        supabase.from('years').select('id, year_label').eq('is_active', true).order('start_date', { ascending: false }),
        supabase.from('csr_partners').select('id, name').eq('is_active', true).order('name'),
        supabase.from('organisations').select('id, name').eq('is_active', true).order('name'),
      ]);
      setYears(y.data?.map((r) => ({ value: r.id, label: r.year_label })) || []);
      setCsrPartners(c.data?.map((r) => ({ value: r.id, label: r.name })) || []);
      setOrganisations(o.data?.map((r) => ({ value: r.id, label: r.name })) || []);
    }
    loadOptions();

    if (project) {
      setForm({
        year_id: project.year_id,
        csr_partner_id: project.csr_partner_id,
        organisation_id: project.organisation_id,
        name: project.name,
        code: project.code || '',
        description: project.description || '',
        total_land_area_acres: String(project.total_land_area_acres),
        total_trees_planned: String(project.total_trees_planned),
        budget_amount: String(project.budget_amount),
        status: project.status,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        location: project.location || '',
        district: project.district || '',
        state: project.state || '',
        is_active: project.is_active,
      });
    } else {
      setForm({
        year_id: selectedYear?.id || '',
        csr_partner_id: '',
        organisation_id: '',
        name: '',
        code: '',
        description: '',
        total_land_area_acres: '0',
        total_trees_planned: '0',
        budget_amount: '0',
        status: 'draft',
        start_date: '',
        end_date: '',
        location: '',
        district: '',
        state: '',
        is_active: true,
      });
    }
    setError('');
  }, [open, project, selectedYear?.id]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');

    const payload = {
      year_id: form.year_id,
      csr_partner_id: form.csr_partner_id,
      organisation_id: form.organisation_id,
      name: form.name,
      code: form.code || null,
      description: form.description || null,
      total_land_area_acres: Number(form.total_land_area_acres) || 0,
      total_trees_planned: Number(form.total_trees_planned) || 0,
      budget_amount: Number(form.budget_amount) || 0,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      location: form.location || null,
      district: form.district || null,
      state: form.state || null,
      is_active: form.is_active,
      ...(!project ? { created_by: user.id } : {}),
    };

    const supabase = createClient();
    const { error: err } = project
      ? await supabase.from('projects').update(payload).eq('id', project.id)
      : await supabase.from('projects').insert(payload);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    onSaved();
    onOpenChange(false);
    setSaving(false);
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent title={project ? 'Edit Project' : 'New Project'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Financial Year" options={years} value={form.year_id} onChange={(e) => set('year_id', e.target.value)} required />
            <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => set('status', e.target.value)} />
            <Select label="CSR Partner" options={csrPartners} value={form.csr_partner_id} onChange={(e) => set('csr_partner_id', e.target.value)} placeholder="Select CSR partner" />
            <Select label="Organisation" options={organisations} value={form.organisation_id} onChange={(e) => set('organisation_id', e.target.value)} placeholder="Select organisation" />
          </div>

          <Input label="Project Name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Project Code" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="e.g. CCAF-2526" />
            <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Land Area (acres)" type="number" step="0.01" value={form.total_land_area_acres} onChange={(e) => set('total_land_area_acres', e.target.value)} />
            <Input label="Trees Planned" type="number" value={form.total_trees_planned} onChange={(e) => set('total_trees_planned', e.target.value)} />
            <Input label="Budget (₹)" type="number" value={form.budget_amount} onChange={(e) => set('budget_amount', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            <Input label="End Date" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            <Input label="District" value={form.district} onChange={(e) => set('district', e.target.value)} />
            <Input label="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded border-gray-300" />
            Active project
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
