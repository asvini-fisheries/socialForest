'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { resourceCategoriesConfig } from '@/lib/master-configs';

export default function ResourceCategoriesMasterPage() {
  return <MasterCrudPage config={resourceCategoriesConfig} />;
}
