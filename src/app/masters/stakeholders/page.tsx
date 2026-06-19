'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { stakeholdersConfig } from '@/lib/master-configs';

export default function StakeholdersMasterPage() {
  return <MasterCrudPage config={stakeholdersConfig} />;
}
