'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ModuleListPage, formatCurrency } from '@/components/modules/module-list-page';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ToolsStockPage() {
  const { selectedProject } = useAuth();

  async function fetchStock() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contractor_tools_stock')
      .select('*, stakeholder:stakeholders(name)')
      .eq('project_id', selectedProject!.id)
      .eq('is_active', true)
      .order('tool_name');
    if (error) throw error;
    return data || [];
  }

  return (
    <ModuleListPage
      title="Tools Stock"
      description="Contractor tools inventory and transactions"
      icon={Wrench}
      emptyTitle="No tools stock recorded yet"
      emptyDescription="Track tools purchased, damaged, or missing per contractor"
      fetchData={fetchStock}
      action={
        <Button disabled>
          <Plus className="w-4 h-4" />
          Add Tool
        </Button>
      }
      columns={[
        { key: 'tool', header: 'Tool', render: (r) => r.tool_name },
        { key: 'contractor', header: 'Contractor', render: (r) => r.stakeholder?.name || '—' },
        { key: 'purchased', header: 'Purchased', render: (r) => r.quantity_purchased },
        { key: 'available', header: 'Available', render: (r) => r.quantity_available },
        { key: 'amount', header: 'Purchase Amt', render: (r) => r.purchase_amount ? formatCurrency(r.purchase_amount) : '—' },
      ]}
    />
  );
}
