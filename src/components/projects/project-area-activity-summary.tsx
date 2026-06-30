'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { AreaActivitySummary } from '@/lib/project-activity-summaries';
import { Activity } from 'lucide-react';

interface ProjectAreaActivitySummaryProps {
  summaries: AreaActivitySummary[];
}

export function ProjectAreaActivitySummaryTable({ summaries }: ProjectAreaActivitySummaryProps) {
  const withData = summaries.filter((s) => s.lines.length > 0);

  if (withData.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No activity records linked to project areas yet
      </p>
    );
  }

  const grandQuantity = withData.reduce((sum, s) => sum + s.totalQuantity, 0);
  const grandAmount = withData.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Project Area</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Activity</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Quantity</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {withData.map((summary) =>
            summary.lines.map((line, idx) => (
              <tr key={`${summary.areaId ?? 'whole'}-${line.activityName}`} className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-900">
                  {idx === 0 ? (
                    <div>
                      <p className="font-medium">{summary.areaName}</p>
                      {summary.areaCode && (
                        <p className="text-xs text-gray-500">{summary.areaCode}</p>
                      )}
                    </div>
                  ) : null}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {line.activityName}
                  </span>
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-gray-900">
                  {line.quantity ? formatNumber(line.quantity) : '—'}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-gray-900">
                  {line.amount ? formatCurrency(line.amount) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
            <td className="py-3 px-4 text-gray-900" colSpan={2}>
              Grand total
            </td>
            <td className="py-3 px-4 text-right tabular-nums">{formatNumber(grandQuantity)}</td>
            <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(grandAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
