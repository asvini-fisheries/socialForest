'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { fetchInwardBills } from '@/lib/nursery-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowDownToLine, ArrowLeft, Loader2, Plus, Search } from 'lucide-react';

type InwardRow = {
  id: string;
  invoice_number: string;
  bill_date: string;
  total_amount: number;
  stakeholder?: { name?: string; code?: string } | null;
};

export default function NurseryInwardsPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<InwardRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchInwardBills(selectedProject.id, search);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inward bills');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadRows(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadRows, search]);

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ArrowDownToLine} title="No project selected" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/nursery" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Nursery
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Nursery Inward Bills</h1>
            <p className="text-gray-500 mt-1">Purchase bills from stakeholders</p>
          </div>
          <Button asChild>
            <Link href="/nursery/inwards/new">
              <Plus className="w-4 h-4" />
              New Inward Bill
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Inward Entries ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search invoice, stakeholder…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon={ArrowDownToLine} title="No inward bills yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Stakeholder</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(row.bill_date)}</td>
                        <td className="py-3 px-4 font-medium">{row.invoice_number}</td>
                        <td className="py-3 px-4">
                          {row.stakeholder?.name || '—'}
                          {row.stakeholder?.code && (
                            <span className="text-gray-400 ml-1">({row.stakeholder.code})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(row.total_amount)}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/nursery/inwards/${row.id}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View
                          </Link>
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
    </DashboardLayout>
  );
}
