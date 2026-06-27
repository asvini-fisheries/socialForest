'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { activityResourceRequirementsConfig } from '@/lib/master-configs-extended';

export default function ActivityResourceRequirementsMasterPage() {
  return <MasterCrudPage config={activityResourceRequirementsConfig} />;
}
