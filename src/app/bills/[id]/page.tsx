'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/auth-context';
import {
  downloadStakeholderBillPdf,
  fetchStakeholderBill,
  updateStakeholderBillStatus,
} from '@/lib/stakeholder-bills-client';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import type { BillStatus } from '@/types/database';
import { ArrowLeft, CheckCircle, Download, Loader2, Receipt, Send, XCircle } from 'lucide-react';

type BillDetail = {
  id: string;
  bill_number: string | null;
  period_from: string;
  period_to: string;
  total_amount: number;
  status: BillStatus;
  remarks: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  stakeholder?: {
    name?: string;
    code?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    gstin?: string | null;
    contact_person?: string | null;
    mobile?: string | null;
  } | null;
  project?: {
    name?: string;
    organisation?: { name?: string } | null;
  } | null;
  items?: {
    id: string;
    description: string | null;
    quantity: number;
    unit_rate: number;
    amount: number;
  }[];
};

export default function BillDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { selectedProject, user } = useAuth();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'organisation';

  const loadBill = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchStakeholderBill(selectedProject.id, id);
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

  async function handleStatusAction(action: 'submit' | 'approve' | 'reject') {
    if (!selectedProject || !bill) return;
    setActionLoading(action);
    setError('');
    setSuccess('');
    try {
      await updateStakeholderBillStatus(selectedProject.id, bill.id, action);
      setSuccess(
        action === 'submit'
          ? 'Bill submitted for approval.'
          : action === 'approve'
            ? 'Bill approved.'
            : 'Bill rejected.'
      );
      await loadBill();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
    setActionLoading('');
  }

  async function handleDownloadPdf() {
    if (!selectedProject || !bill) return;
    setPdfLoading(true);
    setError('');
    try {
      await downloadStakeholderBillPdf(
        selectedProject.id,
        bill.id,
        `${bill.bill_number || 'stakeholder-bill'}.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed');
    }
    setPdfLoading(false);
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
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Bills
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Bill Details</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={pdfLoading || !bill}>
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </Button>
            {canManage && bill?.status === 'draft' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleStatusAction('submit')}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'submit' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </Button>
                <Button onClick={() => handleStatusAction('approve')} disabled={!!actionLoading}>
                  {actionLoading === 'approve' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </Button>
              </>
            )}
            {canManage && bill?.status === 'submitted' && (
              <>
                <Button onClick={() => handleStatusAction('approve')} disabled={!!actionLoading}>
                  {actionLoading === 'approve' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusAction('reject')}
                  disabled={!!actionLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {actionLoading === 'reject' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : !bill ? (
          <EmptyState icon={Receipt} title="Bill not found" />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle>{bill.bill_number || 'Stakeholder Bill'}</CardTitle>
                <StatusBadge status={bill.status} />
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
                  <p className="text-gray-500">Project</p>
                  <p className="font-medium">{bill.project?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Organisation</p>
                  <p className="font-medium">{bill.project?.organisation?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Period</p>
                  <p className="font-medium">
                    {formatDate(bill.period_from)} – {formatDate(bill.period_to)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(bill.total_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted / Approved</p>
                  <p className="font-medium">
                    {bill.submitted_at ? formatDate(bill.submitted_at) : '—'}
                    {bill.approved_at ? ` / ${formatDate(bill.approved_at)}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Line Items ({bill.items?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Rate</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bill.items || []).map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">{item.description || '—'}</td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            {formatNumber(item.quantity)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            {formatCurrency(item.unit_rate)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={3} className="py-3 px-4 text-right">
                          Total
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {formatCurrency(bill.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {canManage && bill.status === 'draft' && (
              <p className="text-sm text-gray-500">
                To approve: click <strong>Submit</strong> then <strong>Approve</strong>, or use{' '}
                <strong>Approve</strong> directly from draft.
              </p>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
