'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { projectActivitiesConfig } from '@/lib/master-configs';

export default function ProjectActivitiesMasterPage() {
  return <MasterCrudPage config={projectActivitiesConfig} />;
}
