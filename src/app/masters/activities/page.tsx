'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { activitiesConfig } from '@/lib/master-configs';

export default function ActivitiesMasterPage() {
  return <MasterCrudPage config={activitiesConfig} />;
}
