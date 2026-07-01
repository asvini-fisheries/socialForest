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
import { fetchOutwardDetailLines } from '@/lib/nursery-client';
import type { OutwardDetailLine } from '@/lib/nursery-lines';
import { formatDate, formatNumber } from '@/lib/utils';
import { ArrowLeft, ArrowUpFromLine, Loader2, Plus } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  plantation: 'Plantation',
  replacement: 'Replacement',
};

type OutwardFilters = {
  dateFrom: string;
  dateTo: string;
  projectArea: string;
  resourceId: string;
};

const EMPTY_FILTERS: OutwardFilters = {
  dateFrom: '',
  dateTo: '',
  projectArea: '',
  resourceId: '',
};

const EXPORT_COLUMNS = [
  { key: 'issue_date', header: 'Date' },
  { key: 'log_number', header: 'Log No' },
  { key: 'project_area', header: 'Project Area' },
  { key: 'issue_category', header: 'Category' },
  { key: 'species_name', header: 'Tree Species' },
  { key: 'quantity', header: 'Qty' },
];

function projectAreaLabel(row: OutwardDetailLine): string {
  return row.project_area_code
    ? `${row.project_area_name} (${row.project_area_code})`
    : row.project_area_name;
}

function speciesLabel(row: OutwardDetailLine): string {
  return row.species_code ? `${row.species_name} (${row.species_code})` : row.species_name;
}

function toExportRow(row: OutwardDetailLine): Record<string, unknown> {
  return {
    issue_date: formatDate(row.issue_date),
    log_number: row.log_number,
    project_area: projectAreaLabel(row),
    issue_category: CATEGORY_LABELS[row.issue_category] || row.issue_category,
    species_name: speciesLabel(row),
    quantity: row.quantity,
  };
}

export default function NurseryOutwardsPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<OutwardDetailLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<OutwardFilters>(EMPTY_FILTERS);

  const loadRows = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchOutwardDetailLines(selectedProject.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outward details');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const projectAreaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.project_area_id) {
        map.set(row.project_area_id, projectAreaLabel(row));
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const speciesOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.resource_id) {
        map.set(row.resource_id, speciesLabel(row));
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.dateFrom && row.issue_date < filters.dateFrom) return false;
      if (filters.dateTo && row.issue_date > filters.dateTo) return false;
      if (filters.projectArea && row.project_area_id !== filters.projectArea) return false;
      if (filters.resourceId && row.resource_id !== filters.resourceId) return false;
      return true;
    });
  }, [rows, filters]);

  const exportRows = useMemo(() => filteredRows.map(toExportRow), [filteredRows]);

  function setFilter<K extends keyof OutwardFilters>(key: K, value: OutwardFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Outward Details</h1>
            <p className="text-gray-500 mt-1">Line-wise sapling issue entries</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExcelExportButton
              sheetName="Outward Details"
              filename="nursery_outward_details.xlsx"
              columns={EXPORT_COLUMNS}
              rows={exportRows}
              disabled={loading || filteredRows.length === 0}
            />
            <Button asChild>
              <Link href="/nursery/outwards/new">
                <Plus className="w-4 h-4" />
                New Outward Log
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Outward Lines ({filteredRows.length})</CardTitle>
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
                label="Project area"
                value={filters.projectArea}
                onChange={(e) => setFilter('projectArea', e.target.value)}
                placeholder="All project areas"
                options={[{ value: '', label: 'All project areas' }, ...projectAreaOptions]}
              />
              <Select
                label="Tree species"
                value={filters.resourceId}
                onChange={(e) => setFilter('resourceId', e.target.value)}
                placeholder="All species"
                options={[{ value: '', label: 'All species' }, ...speciesOptions]}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState icon={ArrowUpFromLine} title="No outward lines found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Log No</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Tree Species</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.line_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(row.issue_date)}</td>
                        <td className="py-3 px-4 font-medium">
                          <Link
                            href={`/nursery/outwards/${row.bill_id}`}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            {row.log_number || '—'}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{projectAreaLabel(row) || '—'}</td>
                        <td className="py-3 px-4">{speciesLabel(row) || '—'}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.quantity)}</td>
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
