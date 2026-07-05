'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/auth-context';
import { fetchContractorInvoices } from '@/lib/contractor-invoices-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceStatus } from '@/types/database';
import { FileText, Loader2, Plus } from 'lucide-react';

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  total_amount: number;
  status: InvoiceStatus;
  stakeholder?: { name?: string } | null;
  organisation?: { name?: string } | null;
};

export default function InvoicesPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvoices = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchContractorInvoices(selectedProject.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-500">Select a project from the header</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contractor Invoices</h1>
            <p className="text-gray-500 mt-1">Invoices submitted to CSR partners</p>
          </div>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Contractor Invoices</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700">No invoices submitted yet</p>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Convert approved activity bills and expenses into invoices for CSR partners
                </p>
                <Button asChild>
                  <Link href="/invoices/new">
                    <Plus className="w-4 h-4" />
                    Create first invoice
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Contractor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/invoices/${row.id}`} className="text-emerald-600 hover:underline font-medium">
                            {row.invoice_number || '—'}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{row.stakeholder?.name || '—'}</td>
                        <td className="py-3 px-4 text-gray-700">{formatDate(row.invoice_date)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium">
                          {formatCurrency(row.total_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={row.status} />
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
