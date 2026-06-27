'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { stakeholderSupplyRatesConfig } from '@/lib/master-configs-extended';

export default function StakeholderSupplyRatesMasterPage() {
  return <MasterCrudPage config={stakeholderSupplyRatesConfig} />;
}
