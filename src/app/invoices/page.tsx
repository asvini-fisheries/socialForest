'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ModuleListPage, StatusBadge, formatCurrency, formatDate } from '@/components/modules/module-list-page';
import { FileText } from 'lucide-react';

export default function InvoicesPage() {
  const { selectedProject } = useAuth();

  async function fetchInvoices() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contractor_invoices')
      .select('*, stakeholder:stakeholders(name)')
      .eq('project_id', selectedProject!.id)
      .order('invoice_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return (
    <ModuleListPage
      title="Contractor Invoices"
      description="Invoices submitted to CSR partners"
      icon={FileText}
      emptyTitle="No invoices submitted yet"
      emptyDescription="Contractors submit invoices for work execution periods"
      fetchData={fetchInvoices}
      columns={[
        { key: 'invoice', header: 'Invoice #', render: (r) => r.invoice_number || '—' },
        { key: 'contractor', header: 'Contractor', render: (r) => r.stakeholder?.name || '—' },
        { key: 'date', header: 'Date', render: (r) => formatDate(r.invoice_date) },
        { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.total_amount) },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
