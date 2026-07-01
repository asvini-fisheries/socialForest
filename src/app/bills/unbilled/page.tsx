'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ExcelExportButton } from '@/components/export/excel-export-button';
import { useAuth } from '@/contexts/auth-context';
import { fetchUnbilledActivities } from '@/lib/stakeholder-bills-client';
import type { UnbilledActivityRow } from '@/lib/stakeholder-bills-unbilled';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';

type Filters = {
  dateFrom: string;
  dateTo: string;
  stakeholder: string;
};

const EMPTY_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  stakeholder: '',
};

const EXPORT_COLUMNS = [
  { key: 'activity_date', header: 'Date' },
  { key: 'stakeholder', header: 'Stakeholder' },
  { key: 'activity_name', header: 'Activity' },
  { key: 'project_area_name', header: 'Project Area' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'amount', header: 'Amount' },
  { key: 'description', header: 'Description' },
];

function stakeholderLabel(row: UnbilledActivityRow): string {
  return row.stakeholder_code
    ? `${row.stakeholder_name} (${row.stakeholder_code})`
    : row.stakeholder_name;
}

function toExportRow(row: UnbilledActivityRow): Record<string, unknown> {
  return {
    activity_date: formatDate(row.activity_date),
    stakeholder: stakeholderLabel(row),
    activity_name: row.activity_name,
    project_area_name: row.project_area_name,
    quantity: row.quantity,
    amount: row.amount,
    description: row.description,
  };
}

export default function UnbilledActivitiesPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<UnbilledActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const loadRows = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchUnbilledActivities(
        selectedProject.id,
        filters.dateFrom || undefined,
        filters.dateTo || undefined
      );
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load unbilled activities');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const stakeholderOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.stakeholder_id) map.set(row.stakeholder_id, stakeholderLabel(row));
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.stakeholder && row.stakeholder_id !== filters.stakeholder) return false;
      return true;
    });
  }, [rows, filters.stakeholder]);

  const exportRows = useMemo(() => filteredRows.map(toExportRow), [filteredRows]);
  const totalAmount = useMemo(
    () => filteredRows.reduce((sum, row) => sum + row.amount, 0),
    [filteredRows]
  );

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ClipboardList} title="No project selected" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-emerald-600 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Bills
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Unbilled Activities</h1>
            <p className="text-gray-500 mt-1">
              Daily activities not yet included in a stakeholder bill
            </p>
          </div>
          <ExcelExportButton
            sheetName="Unbilled Activities"
            filename="unbilled_activities.xlsx"
            columns={EXPORT_COLUMNS}
            rows={exportRows}
            disabled={loading || filteredRows.length === 0}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Unbilled Entries ({filteredRows.length}) — {formatCurrency(totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label="Date from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
              <Input
                label="Date to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
              <Select
                label="Stakeholder"
                value={filters.stakeholder}
                onChange={(e) => setFilter('stakeholder', e.target.value)}
                placeholder="All stakeholders"
                options={[{ value: '', label: 'All stakeholders' }, ...stakeholderOptions]}
              />
              <div className="flex items-end">
                <Button variant="outline" onClick={loadRows} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No unbilled activities"
                description="All activities in this range are already billed, or no entries exist"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Stakeholder</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Activity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(row.activity_date)}</td>
                        <td className="py-3 px-4">{stakeholderLabel(row) || '—'}</td>
                        <td className="py-3 px-4">{row.activity_name}</td>
                        <td className="py-3 px-4">{row.project_area_name || '—'}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.quantity)}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(row.amount)}</td>
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
