'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { certificatesConfig } from '@/lib/master-configs';

export default function CertificatesMasterPage() {
  return <MasterCrudPage config={certificatesConfig} />;
}
