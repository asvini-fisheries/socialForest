'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { projectsConfig } from '@/lib/master-configs';

export default function ProjectsMasterPage() {
  return <MasterCrudPage config={projectsConfig} />;
}
