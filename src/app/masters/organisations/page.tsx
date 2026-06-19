'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { organisationsConfig } from '@/lib/master-configs';

export default function OrganisationsMasterPage() {
  return <MasterCrudPage config={organisationsConfig} />;
}
