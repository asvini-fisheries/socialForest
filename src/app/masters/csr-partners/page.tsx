'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { csrPartnersConfig } from '@/lib/master-configs';

export default function CsrPartnersMasterPage() {
  return <MasterCrudPage config={csrPartnersConfig} />;
}
