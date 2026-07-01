'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ExcelExportButton } from '@/components/export/excel-export-button';
import { useAuth } from '@/contexts/auth-context';
import { fetchNurseryStock } from '@/lib/nursery-client';
import { formatNumber } from '@/lib/utils';
import { Sprout, ArrowDownToLine, ArrowUpFromLine, Loader2, Search, Eye } from 'lucide-react';

type StockRow = {
  project_id: string;
  resource_id: string;
  resource_name: string;
  resource_code: string | null;
  total_inward: number;
  total_issued: number;
  current_stock: number;
};

const STOCK_EXPORT_COLUMNS = [
  { key: 'species', header: 'Species' },
  { key: 'species_code', header: 'Species Code' },
  { key: 'total_inward', header: 'Total Inward' },
  { key: 'total_issued', header: 'Total Issued' },
  { key: 'current_stock', header: 'Current Stock' },
];

function toStockExportRow(row: StockRow): Record<string, unknown> {
  return {
    species: row.resource_name,
    species_code: row.resource_code || '',
    total_inward: row.total_inward,
    total_issued: row.total_issued,
    current_stock: row.current_stock,
  };
}

export default function NurseryPage() {
  const { selectedProject } = useAuth();
  const [stock, setStock] = useState<StockRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStock = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchNurseryStock(selectedProject.id, search);
      setStock(data as StockRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock');
      setStock([]);
    }
    setLoading(false);
  }, [selectedProject, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadStock(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadStock, search]);

  const filteredStock = useMemo(
    () => stock.filter((row) => row.current_stock > 0 || row.total_inward > 0 || !search),
    [stock, search]
  );

  const exportRows = useMemo(() => filteredStock.map(toStockExportRow), [filteredStock]);

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Sprout}
          title="No project selected"
          description="Select a project to manage nursery stock"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centralized Nursery</h1>
            <p className="text-gray-500 mt-1">Stock, inward purchase bills, and outward issues</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/nursery/inwards">
                <Eye className="w-3.5 h-3.5" />
                View Inward Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/nursery/inwards/new">
                <ArrowDownToLine className="w-4 h-4" />
                New Inward Bill
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/nursery/outwards">
                <Eye className="w-3.5 h-3.5" />
                View Outward Details
              </Link>
            </Button>
            <Button asChild>
              <Link href="/nursery/outwards/new">
                <ArrowUpFromLine className="w-4 h-4" />
                New Outward Log
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Current Stock
            </CardTitle>
            <ExcelExportButton
              sheetName="Nursery Stock"
              filename="nursery_stock.xlsx"
              columns={STOCK_EXPORT_COLUMNS}
              rows={exportRows}
              disabled={loading || filteredStock.length === 0}
              label="Export Excel"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search species by name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading stock...
              </div>
            ) : filteredStock.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No nursery stock found"
                description="Record an inward purchase bill to add tree species stock"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Species</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total Inward</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total Issued</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((row) => (
                      <tr key={row.resource_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {row.resource_name}
                          {row.resource_code && (
                            <span className="text-gray-400 ml-1">({row.resource_code})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.total_inward)}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatNumber(row.total_issued)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold">
                          {formatNumber(row.current_stock)}
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
