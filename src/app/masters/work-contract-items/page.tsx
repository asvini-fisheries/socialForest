'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { workContractItemsConfig } from '@/lib/master-configs-extended';

export default function WorkContractItemsMasterPage() {
  return <MasterCrudPage config={workContractItemsConfig} />;
}
