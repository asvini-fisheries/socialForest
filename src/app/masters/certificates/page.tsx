'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { FileText } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  description: string | null;
  validity_period_months: number | null;
  is_active: boolean;
}

export default function CertificatesMasterPage() {
  return (
    <MasterTablePage<Certificate>
      title="Certificates"
      table="certificates"
      icon={FileText}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'desc', header: 'Description', render: (r) => r.description || '—' },
        { key: 'validity', header: 'Validity (months)', render: (r) => r.validity_period_months ?? '—' },
        { key: 'active', header: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
      ]}
    />
  );
}
