'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ModuleListPage, formatCurrency, formatDate } from '@/components/modules/module-list-page';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const { selectedProject } = useAuth();

  async function fetchPayments() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('payments_to_stakeholders')
      .select('*, stakeholder:stakeholders(name)')
      .eq('project_id', selectedProject!.id)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return (
    <ModuleListPage
      title="Payments"
      description="Payments made to stakeholders"
      icon={CreditCard}
      emptyTitle="No payments recorded yet"
      emptyDescription="Record payments to stakeholders against approved bills"
      fetchData={fetchPayments}
      columns={[
        { key: 'date', header: 'Date', render: (r) => formatDate(r.payment_date) },
        { key: 'stakeholder', header: 'Stakeholder', render: (r) => r.stakeholder?.name || '—' },
        { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
        { key: 'mode', header: 'Mode', render: (r) => r.payment_mode || '—' },
        { key: 'ref', header: 'Reference', render: (r) => r.reference_number || '—' },
      ]}
    />
  );
}
