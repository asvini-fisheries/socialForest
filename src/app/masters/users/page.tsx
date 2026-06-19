'use client';

import { MasterCrudPage } from '@/components/masters/master-crud-page';
import { usersConfig } from '@/lib/master-configs';

export default function UsersMasterPage() {
  return <MasterCrudPage config={usersConfig} />;
}
