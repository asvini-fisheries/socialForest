'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { Activity } from 'lucide-react';
import type { Activity as ActivityType } from '@/types/database';

export default function ActivitiesMasterPage() {
  return (
    <MasterTablePage<ActivityType>
      title="Activities"
      table="activities"
      icon={Activity}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'code', header: 'Code', render: (r) => r.code || '—' },
        { key: 'unit', header: 'Unit', render: (r) => r.unit_of_measurement || '—' },
        { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
      ]}
    />
  );
}
