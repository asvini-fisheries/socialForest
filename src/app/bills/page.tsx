'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ModuleListPage, StatusBadge, formatCurrency, formatDate } from '@/components/modules/module-list-page';
import { Receipt } from 'lucide-react';
import type { StakeholderBill } from '@/types/database';

export default function BillsPage() {
  const { selectedProject } = useAuth();

  async function fetchBills() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('stakeholder_bills')
      .select('*, stakeholder:stakeholders(name)')
      .eq('project_id', selectedProject!.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as (StakeholderBill & { stakeholder?: { name: string } })[];
  }

  return (
    <ModuleListPage
      title="Stakeholder Bills"
      description="Bills generated from daily activity entries"
      icon={Receipt}
      emptyTitle="No bills generated yet"
      emptyDescription="Bills are auto-generated from daily activity entries"
      fetchData={fetchBills}
      columns={[
        { key: 'bill', header: 'Bill #', render: (r) => r.bill_number || '—' },
        { key: 'stakeholder', header: 'Stakeholder', render: (r) => r.stakeholder?.name || '—' },
        { key: 'period', header: 'Period', render: (r) => `${formatDate(r.period_from)} – ${formatDate(r.period_to)}` },
        { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.total_amount) },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
