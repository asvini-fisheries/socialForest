'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { stakeholderResourcesConfig } from '@/lib/master-configs-extended';

export default function StakeholderResourcesMasterPage() {
  return <MasterCrudPage config={stakeholderResourcesConfig} />;
}
