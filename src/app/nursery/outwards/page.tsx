'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { fetchOutwardBills } from '@/lib/nursery-client';
import { formatDate, formatNumber } from '@/lib/utils';
import { ArrowLeft, ArrowUpFromLine, Loader2, Plus, Search } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  plantation: 'Plantation',
  replacement: 'Replacement',
};

type OutwardRow = {
  id: string;
  issue_date: string;
  issue_category: string;
  log_number: string | null;
  total_saplings?: number;
  project_area?: { name?: string; code?: string } | null;
};

export default function NurseryOutwardsPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<OutwardRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchOutwardBills(selectedProject.id, search);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outward logs');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadRows(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadRows, search]);

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ArrowUpFromLine} title="No project selected" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/nursery" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Nursery
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Nursery Outward Logs</h1>
            <p className="text-gray-500 mt-1">Saplings issued by project area and log number</p>
          </div>
          <Button asChild>
            <Link href="/nursery/outwards/new">
              <Plus className="w-4 h-4" />
              New Outward Log
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Outward Logs ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search log number, area, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon={ArrowUpFromLine} title="No outward logs yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Log #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Saplings</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(row.issue_date)}</td>
                        <td className="py-3 px-4 font-medium">{row.log_number || '—'}</td>
                        <td className="py-3 px-4">
                          {row.project_area?.name || '—'}
                          {row.project_area?.code && (
                            <span className="text-gray-400 ml-1">({row.project_area.code})</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{CATEGORY_LABELS[row.issue_category] || row.issue_category}</td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {formatNumber(row.total_saplings || 0)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/nursery/outwards/${row.id}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View
                          </Link>
                        </td>
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
