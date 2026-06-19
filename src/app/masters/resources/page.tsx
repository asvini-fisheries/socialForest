'use client';

import { MasterTablePage } from '@/components/masters/master-table-page';
import { Package } from 'lucide-react';
import type { ResourceMaterial } from '@/types/database';

export default function ResourcesMasterPage() {
  return (
    <MasterTablePage<ResourceMaterial>
      title="Resources / Materials"
      table="resources_materials"
      icon={Package}
      columns={[
        { key: 'name', header: 'Name', render: (r) => r.name },
        { key: 'code', header: 'Code', render: (r) => r.code || '—' },
        { key: 'unit', header: 'Unit', render: (r) => r.unit_of_measurement },
        { key: 'category', header: 'Category', render: (r) => r.category || '—' },
        { key: 'tree', header: 'Tree Species', render: (r) => (r.is_tree_species ? 'Yes' : 'No') },
      ]}
    />
  );
}
