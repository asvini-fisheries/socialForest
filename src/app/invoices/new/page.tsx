'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  createContractorInvoice,
  fetchInvoiceSources,
  type InvoiceSourceBill,
  type InvoiceSourceExpense,
} from '@/lib/contractor-invoices-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, FileText, Loader2, Save } from 'lucide-react';

type Option = { value: string; label: string };

function SourceCheckbox({
  checked,
  onChange,
  title,
  subtitle,
  amount,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  subtitle: string;
  amount: number;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-gray-900 shrink-0">
        {formatCurrency(amount)}
      </span>
    </label>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { selectedProject, user } = useAuth();
  const [stakeholders, setStakeholders] = useState<Option[]>([]);
  const [activityBills, setActivityBills] = useState<InvoiceSourceBill[]>([]);
  const [expenses, setExpenses] = useState<InvoiceSourceExpense[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(() => new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(() => new Set());
  const [loadingStakeholders, setLoadingStakeholders] = useState(true);
  const [loadingSources, setLoadingSources] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    stakeholder_id: user?.stakeholder_id || '',
    invoice_date: new Date().toISOString().split('T')[0],
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
      setLoadingStakeholders(false);
    }
    load();
  }, [selectedProject, user?.stakeholder_id]);

  useEffect(() => {
    if (!selectedProject || !form.stakeholder_id) {
      setActivityBills([]);
      setExpenses([]);
      setSelectedBillIds(new Set());
      setSelectedExpenseIds(new Set());
      return;
    }

    const projectId = selectedProject.id;
    async function loadSources() {
      setLoadingSources(true);
      setError('');
      try {
        const data = await fetchInvoiceSources(projectId, form.stakeholder_id);
        setActivityBills(data.activity_bills || []);
        setExpenses(data.expenses || []);
        setSelectedBillIds(new Set());
        setSelectedExpenseIds(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sources');
        setActivityBills([]);
        setExpenses([]);
      }
      setLoadingSources(false);
    }
    loadSources();
  }, [selectedProject, form.stakeholder_id]);

  const selectedTotal = useMemo(() => {
    let total = 0;
    for (const bill of activityBills) {
      if (selectedBillIds.has(bill.id)) total += Number(bill.total_amount) || 0;
    }
    for (const expense of expenses) {
      if (selectedExpenseIds.has(expense.id)) total += Number(expense.amount) || 0;
    }
    return total;
  }, [activityBills, expenses, selectedBillIds, selectedExpenseIds]);

  function toggleBill(id: string, checked: boolean) {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleExpense(id: string, checked: boolean) {
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleSave() {
    if (!selectedProject) return;
    if (!form.stakeholder_id || !form.invoice_date) {
      setError('Contractor and invoice date are required');
      return;
    }
    if (!selectedBillIds.size && !selectedExpenseIds.size) {
      setError('Select at least one activity bill or expense to include');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const invoice = await createContractorInvoice({
        project_id: selectedProject.id,
        stakeholder_id: form.stakeholder_id,
        invoice_date: form.invoice_date,
        invoice_number: form.invoice_number || null,
        remarks: form.remarks || null,
        activity_bill_ids: [...selectedBillIds],
        expense_ids: [...selectedExpenseIds],
      });
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
    setSaving(false);
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={FileText} title="No project selected" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Contractor Invoice</h1>
          <p className="text-gray-500 mt-1">
            Convert approved activity bills and expenses into an invoice for CSR partners
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice Header</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Contractor *"
              value={form.stakeholder_id}
              onChange={(e) => setForm({ ...form, stakeholder_id: e.target.value })}
              placeholder="Select contractor"
              options={stakeholders}
              disabled={isStakeholderUser || loadingStakeholders}
            />
            <Input
              label="Invoice Date *"
              type="date"
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
              required
            />
            <Input
              label="Invoice Number"
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              placeholder="Auto-generated if blank"
            />
            <Input
              label="Remarks"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="sm:col-span-2"
            />
          </CardContent>
        </Card>

        {form.stakeholder_id && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Activity Bills (approved)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingSources ? (
                  <div className="flex justify-center py-6 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : activityBills.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    No approved activity bills available to invoice
                  </p>
                ) : (
                  activityBills.map((bill) => (
                    <SourceCheckbox
                      key={bill.id}
                      checked={selectedBillIds.has(bill.id)}
                      onChange={(checked) => toggleBill(bill.id, checked)}
                      title={bill.bill_number || 'Activity Bill'}
                      subtitle={`${formatDate(bill.period_from)} → ${formatDate(bill.period_to)}`}
                      amount={bill.total_amount}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contractor Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingSources ? (
                  <div className="flex justify-center py-6 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : expenses.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    No expenses available to invoice
                  </p>
                ) : (
                  expenses.map((expense) => (
                    <SourceCheckbox
                      key={expense.id}
                      checked={selectedExpenseIds.has(expense.id)}
                      onChange={(checked) => toggleExpense(expense.id, checked)}
                      title={expense.category || 'Expense'}
                      subtitle={`${formatDate(expense.expense_date)}${expense.description ? ` — ${expense.description}` : ''}`}
                      amount={expense.amount}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm text-gray-500">Selected total</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedTotal)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/invoices')} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.stakeholder_id || selectedTotal <= 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create Invoice
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
