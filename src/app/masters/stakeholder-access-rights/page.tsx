'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { stakeholderAccessRightsConfig } from '@/lib/master-configs-extended';

export default function StakeholderAccessRightsMasterPage() {
  return <MasterCrudPage config={stakeholderAccessRightsConfig} />;
}
