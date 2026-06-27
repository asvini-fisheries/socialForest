'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { organisationCertificatesConfig } from '@/lib/master-configs-extended';

export default function OrganisationCertificatesMasterPage() {
  return <MasterCrudPage config={organisationCertificatesConfig} />;
}
