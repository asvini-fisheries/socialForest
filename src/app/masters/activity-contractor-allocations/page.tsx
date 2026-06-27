'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { activityContractorAllocationsConfig } from '@/lib/master-configs-extended';

export default function ActivityContractorAllocationsMasterPage() {
  return <MasterCrudPage config={activityContractorAllocationsConfig} />;
}
