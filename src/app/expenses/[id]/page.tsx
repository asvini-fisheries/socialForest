'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { fetchContractorExpense } from '@/lib/contractor-expenses-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, ExternalLink, Loader2, Receipt } from 'lucide-react';

type ExpenseDetail = {
  id: string;
  expense_date: string;
  category: string | null;
  description: string | null;
  amount: number;
  vendor_name: string | null;
  invoice_number: string | null;
  remarks: string | null;
  stakeholder?: { name?: string; code?: string | null } | null;
  attachments?: { id: string; file_url: string; file_name: string | null }[];
};

export default function ExpenseDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { selectedProject } = useAuth();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExpense = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchContractorExpense(selectedProject.id, id);
      setExpense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense');
      setExpense(null);
    }
    setLoading(false);
  }, [selectedProject, id]);

  useEffect(() => {
    loadExpense();
  }, [loadExpense]);

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
          <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : !expense ? (
          <EmptyState icon={Receipt} title="Expense not found" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{formatCurrency(expense.amount)}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(expense.expense_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contractor</p>
                  <p className="font-medium">{expense.stakeholder?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{expense.category || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vendor</p>
                  <p className="font-medium">{expense.vendor_name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Invoice Number</p>
                  <p className="font-medium">{expense.invoice_number || '—'}</p>
                </div>
                {expense.description && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Description</p>
                    <p>{expense.description}</p>
                  </div>
                )}
                {expense.remarks && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Remarks</p>
                    <p>{expense.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(expense.attachments?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expense.attachments!.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {file.file_name || 'View attachment'}
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
