'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { Handshake } from 'lucide-react';
import type { CsrPartner } from '@/types/database';

export default function CsrPartnersMasterPage() {
  return (
    <MasterTablePage<CsrPartner>
      title="CSR Partners"
      table="csr_partners"
      icon={Handshake}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'code', header: 'Code', render: (r) => r.code || '—' },
        { key: 'contact', header: 'Contact', render: (r) => r.contact_person || '—' },
        { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '—' },
        { key: 'email', header: 'Email', render: (r) => r.email || '—' },
      ]}
    />
  );
}
