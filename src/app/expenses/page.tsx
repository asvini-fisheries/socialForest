'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { fetchContractorExpenses } from '@/lib/contractor-expenses-client';
import { ModuleListPage, formatCurrency, formatDate } from '@/components/modules/module-list-page';
import { Loader2, Plus, Receipt } from 'lucide-react';

type ExpenseRow = {
  id: string;
  expense_date: string;
  category: string | null;
  description: string | null;
  amount: number;
  stakeholder?: { name?: string } | null;
};

export default function ExpensesPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExpenses = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchContractorExpenses(selectedProject.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  if (!selectedProject) {
    return (
      <ModuleListPage
        title="Contractor Expenses"
        description="Expense entries with purchase invoice proofs"
        icon={Receipt}
        emptyTitle="No project selected"
        fetchData={async () => []}
        columns={[]}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contractor Expenses</h1>
            <p className="text-gray-500 mt-1">Expense entries with purchase invoice proofs</p>
          </div>
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="w-4 h-4" />
              New Expense
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Contractor Expenses</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700">No expenses recorded yet</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Contractors record project expenses with supporting documents
                </p>
                <Button asChild>
                  <Link href="/expenses/new">
                    <Plus className="w-4 h-4" />
                    Record first expense
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Contractor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/expenses/${row.id}`} className="text-emerald-600 hover:underline">
                            {formatDate(row.expense_date)}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{row.stakeholder?.name || '—'}</td>
                        <td className="py-3 px-4 text-gray-700">{row.category || '—'}</td>
                        <td className="py-3 px-4 text-gray-700">{row.description || '—'}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
