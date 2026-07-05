'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/auth-context';
import { fetchContractorInvoice } from '@/lib/contractor-invoices-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceStatus } from '@/types/database';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';

type InvoiceItem = {
  id: string;
  source_type: string;
  stakeholder_bill_id: string | null;
  contractor_expense_id: string | null;
  description: string | null;
  amount: number;
};

type InvoiceDetail = {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  period_from: string | null;
  period_to: string | null;
  total_amount: number;
  status: InvoiceStatus;
  remarks: string | null;
  stakeholder?: { name?: string; code?: string | null } | null;
  organisation?: { name?: string } | null;
  project?: { name?: string; csr_partner?: { name?: string } | null } | null;
  items?: InvoiceItem[];
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { selectedProject } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvoice = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchContractorInvoice(selectedProject.id, id);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
      setInvoice(null);
    }
    setLoading(false);
  }, [selectedProject, id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

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
          <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : !invoice ? (
          <EmptyState icon={FileText} title="Invoice not found" />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{invoice.invoice_number || 'Contractor Invoice'}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    To CSR Partner: {invoice.project?.csr_partner?.name || '—'}
                  </p>
                </div>
                <StatusBadge status={invoice.status} />
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Invoice Date</p>
                  <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contractor</p>
                  <p className="font-medium">{invoice.stakeholder?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Organisation</p>
                  <p className="font-medium">{invoice.organisation?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Period</p>
                  <p className="font-medium">
                    {invoice.period_from && invoice.period_to
                      ? `${formatDate(invoice.period_from)} → ${formatDate(invoice.period_to)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(invoice.total_amount)}</p>
                </div>
                {invoice.remarks && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Remarks</p>
                    <p>{invoice.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Lines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Source</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoice.items || []).map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-700">
                            {item.source_type === 'activity_bill' ? 'Activity Bill' : 'Expense'}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {item.stakeholder_bill_id && (
                              <Link
                                href={`/bills/${item.stakeholder_bill_id}`}
                                className="text-emerald-600 hover:underline"
                              >
                                {item.description || 'View bill'}
                              </Link>
                            )}
                            {item.contractor_expense_id && (
                              <Link
                                href={`/expenses/${item.contractor_expense_id}`}
                                className="text-emerald-600 hover:underline"
                              >
                                {item.description || 'View expense'}
                              </Link>
                            )}
                            {!item.stakeholder_bill_id && !item.contractor_expense_id && (
                              item.description || '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
