'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { projectUserAccessConfig } from '@/lib/master-configs';

export default function ProjectUserAccessMasterPage() {
  return <MasterCrudPage config={projectUserAccessConfig} />;
}
