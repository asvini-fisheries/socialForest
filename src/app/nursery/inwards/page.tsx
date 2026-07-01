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
import { fetchInwardDetailLines } from '@/lib/nursery-client';
import type { InwardDetailLine } from '@/lib/nursery-lines';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { ArrowDownToLine, ArrowLeft, Loader2, Plus } from 'lucide-react';

type InwardFilters = {
  dateFrom: string;
  dateTo: string;
  stakeholder: string;
  resourceId: string;
};

const EMPTY_FILTERS: InwardFilters = {
  dateFrom: '',
  dateTo: '',
  stakeholder: '',
  resourceId: '',
};

const EXPORT_COLUMNS = [
  { key: 'bill_date', header: 'Date' },
  { key: 'invoice_number', header: 'Invoice No' },
  { key: 'stakeholder', header: 'Stakeholder' },
  { key: 'species_name', header: 'Tree Species' },
  { key: 'quantity', header: 'Qty' },
  { key: 'unit_rate', header: 'Rate' },
  { key: 'amount', header: 'Amount' },
];

function stakeholderLabel(row: InwardDetailLine): string {
  return row.stakeholder_code
    ? `${row.stakeholder_name} (${row.stakeholder_code})`
    : row.stakeholder_name;
}

function speciesLabel(row: InwardDetailLine): string {
  return row.species_code ? `${row.species_name} (${row.species_code})` : row.species_name;
}

function toExportRow(row: InwardDetailLine): Record<string, unknown> {
  return {
    bill_date: formatDate(row.bill_date),
    invoice_number: row.invoice_number,
    stakeholder: stakeholderLabel(row),
    species_name: speciesLabel(row),
    quantity: row.quantity,
    unit_rate: row.unit_rate,
    amount: row.amount,
  };
}

export default function NurseryInwardsPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<InwardDetailLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<InwardFilters>(EMPTY_FILTERS);

  const loadRows = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchInwardDetailLines(selectedProject.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inward details');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const stakeholderOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.stakeholder_id) {
        map.set(row.stakeholder_id, stakeholderLabel(row));
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
      if (filters.dateFrom && row.bill_date < filters.dateFrom) return false;
      if (filters.dateTo && row.bill_date > filters.dateTo) return false;
      if (filters.stakeholder && row.stakeholder_id !== filters.stakeholder) return false;
      if (filters.resourceId && row.resource_id !== filters.resourceId) return false;
      return true;
    });
  }, [rows, filters]);

  const exportRows = useMemo(() => filteredRows.map(toExportRow), [filteredRows]);

  function setFilter<K extends keyof InwardFilters>(key: K, value: InwardFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState icon={ArrowDownToLine} title="No project selected" />
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
            <h1 className="text-2xl font-bold text-gray-900">Inward Details</h1>
            <p className="text-gray-500 mt-1">Line-wise inward purchase entries</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExcelExportButton
              sheetName="Inward Details"
              filename="nursery_inward_details.xlsx"
              columns={EXPORT_COLUMNS}
              rows={exportRows}
              disabled={loading || filteredRows.length === 0}
            />
            <Button asChild>
              <Link href="/nursery/inwards/new">
                <Plus className="w-4 h-4" />
                New Inward Bill
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Inward Lines ({filteredRows.length})</CardTitle>
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
              <EmptyState icon={ArrowDownToLine} title="No inward lines found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice No</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Stakeholder</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Tree Species</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Rate</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.line_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(row.bill_date)}</td>
                        <td className="py-3 px-4 font-medium">
                          <Link
                            href={`/nursery/inwards/${row.bill_id}`}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            {row.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{stakeholderLabel(row) || '—'}</td>
                        <td className="py-3 px-4">{speciesLabel(row) || '—'}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.quantity)}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(row.unit_rate)}</td>
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
