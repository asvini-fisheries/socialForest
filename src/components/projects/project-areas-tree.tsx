'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { buildProjectAreaTree } from '@/lib/project-areas-tree';
import type { AreaActivitySummary } from '@/lib/project-activity-summaries';
import type { ProjectArea } from '@/types/database';

interface ProjectAreasTreeProps {
  areas: ProjectArea[];
  activitySummaries?: Map<string, AreaActivitySummary>;
}

function ActivitySummaryLines({ summary }: { summary: AreaActivitySummary }) {
  if (summary.lines.length === 0) return null;

  return (
    <div className="mt-2 mb-2 ml-8 rounded-lg border border-emerald-100 bg-emerald-50/50 text-xs overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 border-b border-emerald-100 font-medium text-gray-500">
        <span>Activity</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Amount</span>
      </div>
      {summary.lines.map((line) => (
        <div
          key={line.activityName}
          className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 border-b border-emerald-50 last:border-0 text-gray-700"
        >
          <span className="truncate">{line.activityName}</span>
          <span className="text-right tabular-nums">{line.quantity ? formatNumber(line.quantity) : '—'}</span>
          <span className="text-right tabular-nums">{line.amount ? formatCurrency(line.amount) : '—'}</span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-emerald-100/60 font-semibold text-gray-800">
        <span>Area total</span>
        <span className="text-right tabular-nums">{formatNumber(summary.totalQuantity)}</span>
        <span className="text-right tabular-nums">{formatCurrency(summary.totalAmount)}</span>
      </div>
    </div>
  );
}

function AreaRow({
  area,
  expanded,
  onToggle,
  hasExpandable,
}: {
  area: ProjectArea;
  expanded: boolean;
  onToggle: () => void;
  hasExpandable: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        {hasExpandable ? (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${area.name}` : `Expand ${area.name}`}
          >
            {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{area.name}</p>
          {area.code && <p className="text-gray-500 text-xs">{area.code}</p>}
        </div>
      </div>
      <div className="text-right text-gray-600 shrink-0 ml-3">
        <p>{area.land_area_acres} ac</p>
        <p className="text-xs">{formatNumber(area.trees_planned)} trees</p>
      </div>
    </div>
  );
}

function AreaNode({
  area,
  depth,
  expandedIds,
  onToggle,
  activitySummaries,
}: {
  area: ProjectArea;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  activitySummaries?: Map<string, AreaActivitySummary>;
}) {
  const expanded = expandedIds.has(area.id);
  const children = area.children ?? [];
  const summary = activitySummaries?.get(area.id);
  const hasChildren = children.length > 0;
  const hasActivities = (summary?.lines.length ?? 0) > 0;
  const hasExpandable = hasChildren || hasActivities;

  return (
    <div className={depth > 0 ? 'border-l-2 border-gray-200 ml-3 pl-2' : ''}>
      <AreaRow
        area={area}
        expanded={expanded}
        onToggle={() => onToggle(area.id)}
        hasExpandable={hasExpandable}
      />
      {expanded && summary && <ActivitySummaryLines summary={summary} />}
      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <AreaNode
              key={child.id}
              area={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              activitySummaries={activitySummaries}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectAreasTree({ areas, activitySummaries }: ProjectAreasTreeProps) {
  const tree = useMemo(() => buildProjectAreaTree(areas), [areas]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (tree.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No areas defined yet</p>;
  }

  return (
    <div className="space-y-2">
      {tree.map((area) => (
        <AreaNode
          key={area.id}
          area={area}
          depth={0}
          expandedIds={expandedIds}
          onToggle={toggle}
          activitySummaries={activitySummaries}
        />
      ))}
    </div>
  );
}
