'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { Users } from 'lucide-react';
import type { Stakeholder } from '@/types/database';

export default function StakeholdersMasterPage() {
  return (
    <MasterTablePage<Stakeholder>
      title="Stakeholders"
      table="stakeholders"
      icon={Users}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'code', header: 'Code', render: (r) => r.code || '—' },
        { key: 'contact', header: 'Contact', render: (r) => r.contact_person || '—' },
        { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '—' },
        { key: 'gstin', header: 'GSTIN', render: (r) => r.gstin || '—' },
      ]}
    />
  );
}
