'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { resourcesConfig } from '@/lib/master-configs';

export default function ResourcesMasterPage() {
  return <MasterCrudPage config={resourcesConfig} />;
}
