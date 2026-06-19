'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { yearsConfig } from '@/lib/master-configs';

export default function YearsMasterPage() {
  return <MasterCrudPage config={yearsConfig} />;
}
