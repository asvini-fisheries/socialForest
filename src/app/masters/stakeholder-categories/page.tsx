'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { stakeholderCategoriesConfig } from '@/lib/master-configs-extended';

export default function StakeholderCategoriesMasterPage() {
  return <MasterCrudPage config={stakeholderCategoriesConfig} />;
}
