'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { buildProjectAreaTree } from '@/lib/project-areas-tree';
import type { ProjectArea } from '@/types/database';

interface ProjectAreasTreeProps {
  areas: ProjectArea[];
}

function AreaRow({
  area,
  depth,
  expanded,
  onToggle,
}: {
  area: ProjectArea;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = (area.children?.length ?? 0) > 0;

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-sm"
      style={{ marginLeft: depth > 0 ? depth * 16 : 0 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${area.name}` : `Expand ${area.name}`}
          >
            {expanded ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
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
}: {
  area: ProjectArea;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const expanded = expandedIds.has(area.id);
  const children = area.children ?? [];

  return (
    <div className={depth > 0 ? 'border-l-2 border-gray-200 ml-3 pl-2' : ''}>
      <AreaRow
        area={area}
        depth={0}
        expanded={expanded}
        onToggle={() => onToggle(area.id)}
      />
      {expanded && children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <AreaNode
              key={child.id}
              area={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectAreasTree({ areas }: ProjectAreasTreeProps) {
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
        />
      ))}
    </div>
  );
}
