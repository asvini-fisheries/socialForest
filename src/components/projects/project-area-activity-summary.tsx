'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import {
  buildActivityTreeByCluster,
  type ClusterActivityTree,
  type DailyActivityAreaRow,
} from '@/lib/project-activity-summaries';
import type { ProjectArea } from '@/types/database';

interface ProjectAreaActivitySummaryProps {
  areas: ProjectArea[];
  entries: DailyActivityAreaRow[];
}

function ExpandButton({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
      aria-expanded={expanded}
      aria-label={label}
    >
      {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
    </button>
  );
}

function DateRows({
  dates,
  depth,
}: {
  dates: ClusterActivityTree['activities'][0]['dates'];
  depth: number;
}) {
  return (
    <div className="border-l-2 border-gray-200 ml-3" style={{ marginLeft: depth * 12 + 12 }}>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
        <span>Date</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Amount</span>
      </div>
      {dates.map((line) => (
        <div
          key={line.date}
          className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50/80"
        >
          <div>
            <p className="text-gray-900">{line.date ? formatDate(line.date) : '—'}</p>
            {line.projectAreaName && (
              <p className="text-xs text-gray-500 mt-0.5">{line.projectAreaName}</p>
            )}
          </div>
          <span className="text-right tabular-nums text-gray-900 self-center">
            {line.quantity ? formatNumber(line.quantity) : '—'}
          </span>
          <span className="text-right tabular-nums text-gray-900 self-center">
            {line.amount ? formatCurrency(line.amount) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActivityNode({
  clusterId,
  activity,
  depth,
  expandedKeys,
  onToggle,
}: {
  clusterId: string;
  activity: ClusterActivityTree['activities'][0];
  depth: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const key = `activity:${clusterId}:${activity.activityName}`;
  const expanded = expandedKeys.has(key);
  const hasDates = activity.dates.length > 0;

  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-emerald-50/60 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          {hasDates ? (
            <ExpandButton
              expanded={expanded}
              onToggle={() => onToggle(key)}
              label={expanded ? `Collapse ${activity.activityName}` : `Expand ${activity.activityName}`}
            />
          ) : (
            <span className="w-6 shrink-0" />
          )}
          <span className="font-medium text-gray-800 truncate">{activity.activityName}</span>
        </div>
        <div className="flex gap-4 shrink-0 tabular-nums text-gray-800">
          <span>{formatNumber(activity.quantity)}</span>
          <span className="min-w-[5.5rem] text-right">{formatCurrency(activity.amount)}</span>
        </div>
      </div>
      {expanded && hasDates && <DateRows dates={activity.dates} depth={depth + 1} />}
    </div>
  );
}

function ClusterNode({
  cluster,
  expandedKeys,
  onToggle,
}: {
  cluster: ClusterActivityTree;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const clusterId = cluster.areaId ?? 'whole';
  const key = `cluster:${clusterId}`;
  const expanded = expandedKeys.has(key);
  const hasActivities = cluster.activities.length > 0;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          {hasActivities ? (
            <ExpandButton
              expanded={expanded}
              onToggle={() => onToggle(key)}
              label={expanded ? `Collapse ${cluster.areaName}` : `Expand ${cluster.areaName}`}
            />
          ) : (
            <span className="w-6 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{cluster.areaName}</p>
            {cluster.areaCode && <p className="text-xs text-gray-500">{cluster.areaCode}</p>}
          </div>
        </div>
        <div className="flex gap-4 shrink-0 tabular-nums font-semibold text-gray-900">
          <span>{formatNumber(cluster.quantity)}</span>
          <span className="min-w-[5.5rem] text-right">{formatCurrency(cluster.amount)}</span>
        </div>
      </div>
      {expanded && hasActivities && (
        <div className="p-2 space-y-1 bg-white">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1 text-xs font-medium text-gray-400">
            <span>Activity</span>
            <span className="text-right">Quantity</span>
            <span className="text-right">Amount</span>
          </div>
          {cluster.activities.map((activity) => (
            <ActivityNode
              key={activity.activityName}
              clusterId={clusterId}
              activity={activity}
              depth={1}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectAreaActivitySummaryTable({ areas, entries }: ProjectAreaActivitySummaryProps) {
  const tree = useMemo(() => buildActivityTreeByCluster(areas, entries), [areas, entries]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (tree.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No activity records linked to project areas yet
      </p>
    );
  }

  const grandQuantity = tree.reduce((sum, c) => sum + c.quantity, 0);
  const grandAmount = tree.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
        <span>Cluster / Project Area</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Amount</span>
      </div>

      {tree.map((cluster) => (
        <ClusterNode
          key={cluster.areaId ?? 'whole'}
          cluster={cluster}
          expandedKeys={expandedKeys}
          onToggle={toggle}
        />
      ))}

      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-3 rounded-lg bg-gray-50 font-semibold text-sm text-gray-900 border-t-2 border-gray-200">
        <span>Grand total</span>
        <span className="text-right tabular-nums">{formatNumber(grandQuantity)}</span>
        <span className="text-right tabular-nums min-w-[5.5rem]">{formatCurrency(grandAmount)}</span>
      </div>
    </div>
  );
}
