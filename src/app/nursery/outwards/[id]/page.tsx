'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { fetchOutwardBill } from '@/lib/nursery-client';
import { formatDate, formatNumber } from '@/lib/utils';
import { ArrowLeft, ArrowUpFromLine, Loader2 } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  plantation: 'Plantation',
  replacement: 'Replacement',
};

type OutwardBill = {
  id: string;
  issue_date: string;
  issue_category: string;
  log_number: string | null;
  remarks: string | null;
  project_area?: { name?: string; code?: string } | null;
  items?: {
    id: string;
    quantity: number;
    resource?: { name?: string; code?: string } | null;
  }[];
};

export default function OutwardDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { selectedProject } = useAuth();
  const [bill, setBill] = useState<OutwardBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBill = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchOutwardBill(selectedProject.id, id);
      setBill(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outward log');
      setBill(null);
    }
    setLoading(false);
  }, [selectedProject, id]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const totalSaplings = (bill?.items || []).reduce((sum, item) => sum + item.quantity, 0);

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ArrowUpFromLine} title="No project selected" />
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
          <h1 className="text-2xl font-bold text-gray-900">Outward Log Details</h1>
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
          <EmptyState icon={ArrowUpFromLine} title="Outward log not found" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{bill.log_number || 'Outward Log'}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(bill.issue_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Project Area</p>
                  <p className="font-medium">
                    {bill.project_area?.name || '—'}
                    {bill.project_area?.code && (
                      <span className="text-gray-400 ml-1">({bill.project_area.code})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{CATEGORY_LABELS[bill.issue_category] || bill.issue_category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Saplings</p>
                  <p className="font-semibold text-lg">{formatNumber(totalSaplings)}</p>
                </div>
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
                <CardTitle>Sapling Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Tree Species</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Quantity</th>
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
                          <td className="py-3 px-4 text-right tabular-nums font-medium">
                            {formatNumber(item.quantity)}
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
