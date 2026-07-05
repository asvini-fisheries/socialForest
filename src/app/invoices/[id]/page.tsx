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
  downloadContractorInvoicePdf,
  fetchContractorInvoice,
} from '@/lib/contractor-invoices-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceStatus } from '@/types/database';
import { ArrowLeft, Download, ExternalLink, FileText, ImageIcon, Loader2 } from 'lucide-react';

type ActivityImage = {
  id: string;
  image_url: string;
  caption?: string | null;
};

type BillItem = {
  id: string;
  description: string | null;
  daily_activity_id: string | null;
  daily_activity?: {
    id: string;
    activity_date: string;
    images?: ActivityImage[] | null;
  } | null;
};

type StakeholderBill = {
  id: string;
  bill_number: string | null;
  items?: BillItem[] | null;
};

type ExpenseAttachment = {
  id: string;
  file_url: string;
  file_name: string | null;
};

type ContractorExpense = {
  id: string;
  expense_date: string;
  category: string | null;
  description: string | null;
  attachments?: ExpenseAttachment[] | null;
};

type InvoiceItem = {
  id: string;
  source_type: string;
  stakeholder_bill_id: string | null;
  contractor_expense_id: string | null;
  description: string | null;
  amount: number;
  stakeholder_bill?: StakeholderBill | null;
  contractor_expense?: ContractorExpense | null;
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

function collectActivityImages(bill?: StakeholderBill | null): ActivityImage[] {
  if (!bill?.items?.length) return [];
  const seen = new Set<string>();
  const images: ActivityImage[] = [];
  for (const item of bill.items) {
    for (const image of item.daily_activity?.images || []) {
      if (seen.has(image.id)) continue;
      seen.add(image.id);
      images.push(image);
    }
  }
  return images;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { selectedProject } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

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

  async function handleDownloadPdf() {
    if (!selectedProject || !invoice) return;
    setPdfLoading(true);
    setError('');
    try {
      await downloadContractorInvoicePdf(
        selectedProject.id,
        invoice.id,
        `${invoice.invoice_number || 'contractor-invoice'}.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed');
    }
    setPdfLoading(false);
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
          </div>
          {invoice && (
            <Button variant="outline" onClick={handleDownloadPdf} disabled={pdfLoading}>
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </Button>
          )}
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
              <CardContent className="space-y-6">
                {(invoice.items || []).map((item) => {
                  const activityImages =
                    item.source_type === 'activity_bill'
                      ? collectActivityImages(item.stakeholder_bill)
                      : [];
                  const expenseAttachments =
                    item.source_type === 'expense'
                      ? item.contractor_expense?.attachments || []
                      : [];

                  return (
                    <div key={item.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            {item.source_type === 'activity_bill' ? 'Activity Bill' : 'Expense'}
                          </p>
                          <p className="font-medium text-gray-900 mt-1">
                            {item.stakeholder_bill_id && (
                              <Link
                                href={`/bills/${item.stakeholder_bill_id}`}
                                className="text-emerald-600 hover:underline"
                              >
                                {item.description ||
                                  item.stakeholder_bill?.bill_number ||
                                  'View activity bill'}
                              </Link>
                            )}
                            {item.contractor_expense_id && (
                              <Link
                                href={`/expenses/${item.contractor_expense_id}`}
                                className="text-emerald-600 hover:underline"
                              >
                                {item.description ||
                                  item.contractor_expense?.description ||
                                  'View expense'}
                              </Link>
                            )}
                            {!item.stakeholder_bill_id && !item.contractor_expense_id && (
                              item.description || '—'
                            )}
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums">{formatCurrency(item.amount)}</p>
                      </div>

                      {activityImages.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            Activity images
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {activityImages.map((image, index) => (
                              <a
                                key={image.id}
                                href={image.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {image.caption?.trim() || `Image ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {expenseAttachments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            Expense attachments
                          </p>
                          <div className="space-y-1">
                            {expenseAttachments.map((file) => (
                              <a
                                key={file.id}
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {file.file_name || 'View attachment'}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
