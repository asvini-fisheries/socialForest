'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { projectAreasConfig } from '@/lib/master-configs';

export default function ProjectAreasMasterPage() {
  return <MasterCrudPage config={projectAreasConfig} />;
}
