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
  NurseryLineItemsEditor,
  createEmptyLine,
  type LineRow,
} from '@/components/nursery/nursery-line-items-editor';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { saveInwardBill, uploadNurseryBillImage } from '@/lib/nursery-client';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

type Option = { value: string; label: string };

export default function NewInwardBillPage() {
  const router = useRouter();
  const { selectedProject } = useAuth();
  const [stakeholders, setStakeholders] = useState<Option[]>([]);
  const [species, setSpecies] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [header, setHeader] = useState({
    stakeholder_id: '',
    invoice_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [lines, setLines] = useState<LineRow[]>([createEmptyLine()]);

  useEffect(() => {
    if (!selectedProject) return;
    async function load() {
      const supabase = createClient();
      const [stakeholdersRes, speciesRes] = await Promise.all([
        supabase.from('stakeholders').select('id, name, code').eq('is_active', true).order('name'),
        supabase
          .from('resources_materials')
          .select('id, name, code')
          .eq('is_tree_species', true)
          .eq('is_active', true)
          .order('name'),
      ]);
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
    }
    load();
  }, [selectedProject]);

  async function handleSave() {
    if (!selectedProject) return;
    if (!header.stakeholder_id || !header.invoice_number.trim() || !header.bill_date) {
      setError('Stakeholder, invoice number, and date are required');
      return;
    }

    const items = lines
      .filter((l) => l.resource_id && Number(l.quantity) > 0)
      .map((l) => ({
        resource_id: l.resource_id,
        quantity: Number(l.quantity),
        unit_rate: Number(l.unit_rate) || 0,
      }));

    if (!items.length) {
      setError('Add at least one species line with quantity');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadNurseryBillImage(selectedProject.id, imageFile, 'inward');
      }
      const bill = await saveInwardBill({
        project_id: selectedProject.id,
        stakeholder_id: header.stakeholder_id,
        invoice_number: header.invoice_number.trim(),
        bill_date: header.bill_date,
        image_url,
        remarks: header.remarks || null,
        items,
      });
      router.push(`/nursery/inwards/${bill.id}`);
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
          <Link href="/nursery/inwards" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Inward List
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Inward Purchase Bill</h1>
          <p className="text-gray-500 mt-1">Record nursery stock received from a stakeholder</p>
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
                <CardTitle>Bill Header</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Stakeholder"
                  value={header.stakeholder_id}
                  onChange={(e) => setHeader((h) => ({ ...h, stakeholder_id: e.target.value }))}
                  placeholder="Select stakeholder"
                  options={stakeholders}
                />
                <Input
                  label="Invoice Number"
                  value={header.invoice_number}
                  onChange={(e) => setHeader((h) => ({ ...h, invoice_number: e.target.value }))}
                  required
                />
                <Input
                  label="Bill Date"
                  type="date"
                  value={header.bill_date}
                  onChange={(e) => setHeader((h) => ({ ...h, bill_date: e.target.value }))}
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Invoice Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
                  />
                </div>
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
                <NurseryLineItemsEditor lines={lines} species={species} onChange={setLines} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/nursery/inwards">Cancel</Link>
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Inward Bill
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
