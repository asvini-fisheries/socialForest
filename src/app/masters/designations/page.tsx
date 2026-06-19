'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { designationsConfig } from '@/lib/master-configs';

export default function DesignationsMasterPage() {
  return <MasterCrudPage config={designationsConfig} />;
}
