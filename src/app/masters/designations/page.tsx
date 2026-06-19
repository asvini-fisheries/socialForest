'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { ClipboardList } from 'lucide-react';

interface Designation {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export default function DesignationsMasterPage() {
  return (
    <MasterTablePage<Designation>
      title="Designations"
      table="designations"
      icon={ClipboardList}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'desc', header: 'Description', render: (r) => r.description || '—' },
        { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
      ]}
    />
  );
}
