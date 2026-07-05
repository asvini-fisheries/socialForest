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
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { saveContractorExpense, uploadExpenseAttachment } from '@/lib/contractor-expenses-client';
import { ArrowLeft, Loader2, Receipt, Save, Upload, X } from 'lucide-react';

type Option = { value: string; label: string };

const CATEGORY_OPTIONS = [
  { value: 'Materials', label: 'Materials' },
  { value: 'Labour', label: 'Labour' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Office', label: 'Office' },
  { value: 'Other', label: 'Other' },
];

export default function NewExpensePage() {
  const router = useRouter();
  const { selectedProject, user } = useAuth();
  const [stakeholders, setStakeholders] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    stakeholder_id: user?.stakeholder_id || '',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    vendor_name: '',
    invoice_number: '',
    remarks: '',
  });

  const isStakeholderUser = user?.role === 'stakeholder';

  useEffect(() => {
    if (!selectedProject) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stakeholders')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      setStakeholders(
        (data || []).map((s) => ({
          value: s.id,
          label: s.code ? `${s.name} (${s.code})` : s.name,
        }))
      );
      if (user?.stakeholder_id) {
        setForm((prev) => ({ ...prev, stakeholder_id: user.stakeholder_id || '' }));
      }
      setLoading(false);
    }
    load();
  }, [selectedProject, user?.stakeholder_id]);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  async function handleSave() {
    if (!selectedProject) return;
    if (!form.stakeholder_id || !form.expense_date) {
      setError('Contractor and expense date are required');
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const attachments = await Promise.all(
        files.map((file) => uploadExpenseAttachment(selectedProject.id, file))
      );
      const expense = await saveContractorExpense({
        project_id: selectedProject.id,
        stakeholder_id: form.stakeholder_id,
        expense_date: form.expense_date,
        category: form.category || null,
        description: form.description || null,
        amount,
        vendor_name: form.vendor_name || null,
        invoice_number: form.invoice_number || null,
        remarks: form.remarks || null,
        attachments,
      });
      router.push(`/expenses/${expense.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
    setSaving(false);
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={Receipt} title="No project selected" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <Link href="/expenses" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Expenses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Contractor Expense</h1>
          <p className="text-gray-500 mt-1">Record an expense with purchase invoice proof</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Contractor *"
                    value={form.stakeholder_id}
                    onChange={(e) => setForm({ ...form, stakeholder_id: e.target.value })}
                    placeholder="Select contractor"
                    options={stakeholders}
                    disabled={isStakeholderUser}
                  />
                  <Input
                    label="Expense Date *"
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    required
                  />
                  <Select
                    label="Category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Select category"
                    options={CATEGORY_OPTIONS}
                  />
                  <Input
                    label="Amount (₹) *"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                  <Input
                    label="Vendor Name"
                    value={form.vendor_name}
                    onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                  />
                  <Input
                    label="Invoice Number"
                    value={form.invoice_number}
                    onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  />
                </div>
                <Input
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <Input
                  label="Remarks"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Purchase Invoice / Proof
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                      <Upload className="w-4 h-4" />
                      Upload file
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,application/pdf"
                        multiple
                        onChange={(e) => addFiles(e.target.files)}
                      />
                    </label>
                  </div>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/expenses')} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Expense
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
