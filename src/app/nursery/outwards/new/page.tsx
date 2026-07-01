'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import {
  NurserySaplingLinesEditor,
  createEmptySaplingLine,
  type SaplingLineRow,
} from '@/components/nursery/nursery-sapling-lines-editor';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { saveOutwardBill } from '@/lib/nursery-client';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

type Option = { value: string; label: string };

export default function NewOutwardPage() {
  const router = useRouter();
  const { selectedProject } = useAuth();
  const [areas, setAreas] = useState<Option[]>([]);
  const [species, setSpecies] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [header, setHeader] = useState({
    project_area_id: '',
    log_number: '',
    issue_category: 'plantation',
    issue_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [lines, setLines] = useState<SaplingLineRow[]>([createEmptySaplingLine()]);

  useEffect(() => {
    if (!selectedProject) return;
    const projectId = selectedProject.id;
    async function load() {
      const supabase = createClient();
      const [areasRes, speciesRes] = await Promise.all([
        supabase
          .from('project_areas')
          .select('id, name, code')
          .eq('project_id', projectId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('resources_materials')
          .select('id, name, code')
          .eq('is_tree_species', true)
          .eq('is_active', true)
          .order('name'),
      ]);
      setAreas(
        (areasRes.data || []).map((a) => ({
          value: a.id,
          label: a.code ? `${a.name} (${a.code})` : a.name,
        }))
      );
      setSpecies(
        (speciesRes.data || []).map((r) => ({
          value: r.id,
          label: r.code ? `${r.name} (${r.code})` : r.name,
        }))
      );
      setLoading(false);
    }
    load();
  }, [selectedProject]);

  async function handleSave() {
    if (!selectedProject) return;
    if (!header.project_area_id) {
      setError('Project area is required');
      return;
    }
    if (!header.log_number.trim()) {
      setError('Log number is required');
      return;
    }
    if (!header.issue_date) {
      setError('Issue date is required');
      return;
    }

    const items = lines
      .filter((l) => l.resource_id && Number(l.quantity) > 0)
      .map((l) => ({
        resource_id: l.resource_id,
        quantity: Number(l.quantity),
      }));

    if (!items.length) {
      setError('Add at least one sapling line with quantity');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const bill = await saveOutwardBill({
        project_id: selectedProject.id,
        project_area_id: header.project_area_id,
        issue_category: header.issue_category,
        log_number: header.log_number.trim(),
        issue_date: header.issue_date,
        remarks: header.remarks || null,
        items,
      });
      router.push(`/nursery/outwards/${bill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
    setSaving(false);
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ArrowLeft} title="No project selected" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <Link href="/nursery/outwards" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Outward List
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Outward Issue Log</h1>
          <p className="text-gray-500 mt-1">Issue saplings to a project area</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Issue Log Header</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Project Area"
                  value={header.project_area_id}
                  onChange={(e) => setHeader((h) => ({ ...h, project_area_id: e.target.value }))}
                  placeholder="Select project area"
                  options={areas}
                />
                <Input
                  label="Log Number"
                  value={header.log_number}
                  onChange={(e) => setHeader((h) => ({ ...h, log_number: e.target.value }))}
                  placeholder="e.g. OUT-2025-001"
                  required
                />
                <Input
                  label="Issue Date"
                  type="date"
                  value={header.issue_date}
                  onChange={(e) => setHeader((h) => ({ ...h, issue_date: e.target.value }))}
                  required
                />
                <Select
                  label="Issue Category"
                  value={header.issue_category}
                  onChange={(e) => setHeader((h) => ({ ...h, issue_category: e.target.value }))}
                  options={[
                    { value: 'plantation', label: 'Plantation' },
                    { value: 'replacement', label: 'Replacement' },
                  ]}
                />
                <Input
                  label="Remarks"
                  value={header.remarks}
                  onChange={(e) => setHeader((h) => ({ ...h, remarks: e.target.value }))}
                  className="sm:col-span-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <NurserySaplingLinesEditor lines={lines} species={species} onChange={setLines} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/nursery/outwards">Cancel</Link>
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Outward Log
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
