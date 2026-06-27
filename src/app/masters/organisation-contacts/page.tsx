'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { organisationContactsConfig } from '@/lib/master-configs-extended';

export default function OrganisationContactsMasterPage() {
  return <MasterCrudPage config={organisationContactsConfig} />;
}
