'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Year } from '@/types/database';

export default function YearsMasterPage() {
  return (
    <MasterTablePage<Year>
      title="Years"
      table="years"
      icon={Calendar}
      orderBy="start_date"
      columns={[
        { key: 'label', header: 'Year', render: (r) => r.year_label },
        { key: 'start', header: 'Start', render: (r) => formatDate(r.start_date) },
        { key: 'end', header: 'End', render: (r) => formatDate(r.end_date) },
        { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
      ]}
    />
  );
}
