'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ModuleListPage, formatCurrency, formatDate } from '@/components/modules/module-list-page';
import { Receipt } from 'lucide-react';

export default function ExpensesPage() {
  const { selectedProject } = useAuth();

  async function fetchExpenses() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contractor_expenses')
      .select('*, stakeholder:stakeholders(name)')
      .eq('project_id', selectedProject!.id)
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  return (
    <ModuleListPage
      title="Contractor Expenses"
      description="Expense entries with purchase invoice proofs"
      icon={Receipt}
      emptyTitle="No expenses recorded yet"
      emptyDescription="Contractors record project expenses with supporting documents"
      fetchData={fetchExpenses}
      columns={[
        { key: 'date', header: 'Date', render: (r) => formatDate(r.expense_date) },
        { key: 'contractor', header: 'Contractor', render: (r) => r.stakeholder?.name || '—' },
        { key: 'category', header: 'Category', render: (r) => r.category || '—' },
        { key: 'description', header: 'Description', render: (r) => r.description || '—' },
        { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
      ]}
    />
  );
}
