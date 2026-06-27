'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { workContractsConfig } from '@/lib/master-configs-extended';

export default function WorkContractsMasterPage() {
  return <MasterCrudPage config={workContractsConfig} />;
}
