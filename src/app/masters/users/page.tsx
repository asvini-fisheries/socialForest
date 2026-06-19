'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users } from 'lucide-react';
import { ROLE_LABELS, type User } from '@/types/database';

export default function UsersMasterPage() {
  return (
    <MasterTablePage<User>
      title="Users"
      table="users"
      icon={Users}
      orderBy="full_name"
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.full_name },
        { key: 'mobile', header: 'Mobile', render: (r) => r.mobile },
        { key: 'email', header: 'Email', render: (r) => r.email || '—' },
        { key: 'role', header: 'Role', render: (r) => ROLE_LABELS[r.role] },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
