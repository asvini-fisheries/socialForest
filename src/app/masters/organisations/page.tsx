'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { Building2 } from 'lucide-react';
import type { Organisation } from '@/types/database';

export default function OrganisationsMasterPage() {
  return (
    <MasterTablePage<Organisation>
      title="Organisations"
      table="organisations"
      icon={Building2}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'code', header: 'Code', render: (r) => r.code || '—' },
        { key: 'city', header: 'City', render: (r) => r.city || '—' },
        { key: 'gstin', header: 'GSTIN', render: (r) => r.gstin || '—' },
        { key: 'pan', header: 'PAN', render: (r) => r.pan || '—' },
      ]}
    />
  );
}
