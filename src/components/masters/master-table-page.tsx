'use client';

import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { createClient } from '@/lib/supabase/client';
import { Loader2, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface MasterTablePageProps<T extends { id: string }> {
  title: string;
  table: string;
  icon: LucideIcon;
  columns: Column<T>[];
  orderBy?: string;
}

export function MasterTablePage<T extends { id: string }>({
  title,
  table,
  icon: Icon,
  columns,
  orderBy = 'name',
}: MasterTablePageProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error: err } = await supabase.from(table).select('*').order(orderBy);
      if (err) setError(err.message);
      else setRows((data as T[]) || []);
      setLoading(false);
    }
    load();
  }, [table, orderBy]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">Master data management</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-emerald-600" />
              {title}
              <span className="text-sm font-normal text-gray-400 ml-2">({rows.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon={Icon} title={`No ${title.toLowerCase()} found`} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {columns.map((col) => (
                        <th key={col.key} className="text-left py-3 px-4 font-medium text-gray-500">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {columns.map((col) => (
                          <td key={col.key} className="py-3 px-4 text-gray-700">
                            {col.render(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
