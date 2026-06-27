'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { organisationEmployeesConfig } from '@/lib/master-configs-extended';

export default function OrganisationEmployeesMasterPage() {
  return <MasterCrudPage config={organisationEmployeesConfig} />;
}
