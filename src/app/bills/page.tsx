'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchStakeholderBills,
  generateStakeholderBills,
  previewStakeholderBills,
  type BillPreview,
} from '@/lib/stakeholder-bills-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { BillStatus } from '@/types/database';
import { FileText, Loader2, Receipt, Sparkles } from 'lucide-react';

type BillRow = {
  id: string;
  bill_number: string | null;
  period_from: string;
  period_to: string;
  total_amount: number;
  status: BillStatus;
  stakeholder?: { name?: string; code?: string | null } | null;
};

function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

export default function BillsPage() {
  const { selectedProject } = useAuth();
  const defaults = defaultPeriod();
  const [rows, setRows] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [periodFrom, setPeriodFrom] = useState(defaults.from);
  const [periodTo, setPeriodTo] = useState(defaults.to);
  const [preview, setPreview] = useState<BillPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadBills = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchStakeholderBills(selectedProject.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bills');
      setRows([]);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  async function handlePreview() {
    if (!selectedProject) return;
    if (!periodFrom || !periodTo) {
      setError('Select both period start and end dates');
      return;
    }
    if (periodFrom > periodTo) {
      setError('Period start must be on or before period end');
      return;
    }

    setPreviewing(true);
    setError('');
    setSuccess('');
    try {
      const data = await previewStakeholderBills(selectedProject.id, periodFrom, periodTo);
      setPreview(data);
      if (!data.total_activities) {
        setError('No unbilled daily activities found for this period');
      }
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : 'Preview failed');
    }
    setPreviewing(false);
  }

  async function handleGenerate() {
    if (!selectedProject) return;
    if (!periodFrom || !periodTo) {
      setError('Select both period start and end dates');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const result = await generateStakeholderBills({
        project_id: selectedProject.id,
        period_from: periodFrom,
        period_to: periodTo,
      });
      setSuccess(
        `Created ${result.bills_created} bill(s) for ${result.activities_billed} activity entries (${formatCurrency(result.total_amount)}).`
      );
      setPreview(null);
      await loadBills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bill generation failed');
    }
    setGenerating(false);
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Receipt}
          title="No project selected"
          description="Select a project from the header to manage stakeholder bills"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stakeholder Bills</h1>
          <p className="text-gray-500 mt-1">Generate bills from daily activity entries for a custom date range</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Generate Bills from Daily Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Select a date range. The system will group unbilled daily activities by stakeholder and create one draft
              bill per stakeholder. Activities already linked to a bill are skipped.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <Input
                label="Period from"
                type="date"
                value={periodFrom}
                onChange={(e) => {
                  setPeriodFrom(e.target.value);
                  setPreview(null);
                }}
              />
              <Input
                label="Period to"
                type="date"
                value={periodTo}
                onChange={(e) => {
                  setPeriodTo(e.target.value);
                  setPreview(null);
                }}
              />
              <Button variant="outline" onClick={handlePreview} disabled={previewing || generating}>
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Preview
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || previewing || !preview?.total_activities}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Bills
              </Button>
            </div>

            {preview && preview.total_activities > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Preview: {preview.total_activities} unbilled activit{preview.total_activities === 1 ? 'y' : 'ies'}{' '}
                  ({formatCurrency(preview.total_amount)}) from {formatDate(preview.period_from)} to{' '}
                  {formatDate(preview.period_to)}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Stakeholder</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Activities</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.stakeholders.map((row) => (
                        <tr key={row.stakeholder_id} className="border-b border-gray-100">
                          <td className="py-2 px-3">{row.stakeholder_name}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{row.activity_count}</td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {formatCurrency(row.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Generated Bills ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No bills generated yet"
                description="Use the form above to generate bills from daily activity entries"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Bill #</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Stakeholder</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{row.bill_number || '—'}</td>
                        <td className="py-3 px-4">
                          {row.stakeholder?.name || '—'}
                          {row.stakeholder?.code && (
                            <span className="text-gray-400 ml-1">({row.stakeholder.code})</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(row.period_from)} – {formatDate(row.period_to)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          {formatCurrency(row.total_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={row.status} />
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
