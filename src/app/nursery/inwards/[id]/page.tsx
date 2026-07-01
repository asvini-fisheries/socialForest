'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { fetchInwardBill } from '@/lib/nursery-client';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { ArrowDownToLine, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

type InwardBill = {
  id: string;
  invoice_number: string;
  bill_date: string;
  image_url: string | null;
  remarks: string | null;
  total_amount: number;
  stakeholder?: { name?: string; code?: string } | null;
  items?: {
    id: string;
    quantity: number;
    unit_rate: number;
    amount: number;
    resource?: { name?: string; code?: string } | null;
  }[];
};

export default function InwardBillDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { selectedProject } = useAuth();
  const [bill, setBill] = useState<InwardBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBill = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchInwardBill(selectedProject.id, id);
      setBill(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bill');
      setBill(null);
    }
    setLoading(false);
  }, [selectedProject, id]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ArrowDownToLine} title="No project selected" />
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
          <h1 className="text-2xl font-bold text-gray-900">Inward Bill Details</h1>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : !bill ? (
          <EmptyState icon={ArrowDownToLine} title="Bill not found" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{bill.invoice_number}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(bill.bill_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Stakeholder</p>
                  <p className="font-medium">
                    {bill.stakeholder?.name || '—'}
                    {bill.stakeholder?.code && (
                      <span className="text-gray-400 ml-1">({bill.stakeholder.code})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(bill.total_amount)}</p>
                </div>
                {bill.image_url && (
                  <div>
                    <p className="text-gray-500">Invoice Image</p>
                    <a
                      href={bill.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      View attachment
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {bill.remarks && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Remarks</p>
                    <p>{bill.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Species Lines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Species</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Rate</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bill.items || []).map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            {item.resource?.name || '—'}
                            {item.resource?.code && (
                              <span className="text-gray-400 ml-1">({item.resource.code})</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">{formatNumber(item.quantity)}</td>
                          <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(item.unit_rate)}</td>
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
