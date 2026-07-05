'use client';

import { Fragment } from 'react';
import { formatNumber } from '@/lib/utils';
import { buildClusterBlockMatrix, getMatrixCell } from '@/lib/project-area-matrix';
import type { ProjectArea } from '@/types/database';

interface ClusterBlockMatrixProps {
  cluster: ProjectArea;
}

function MatrixCell({ area }: { area: ProjectArea | null }) {
  if (!area) {
    return <span className="text-gray-300">—</span>;
  }

  return (
    <div className="text-center leading-tight">
      <p className="font-medium text-gray-800 tabular-nums">{area.land_area_acres} ac</p>
      <p className="text-[11px] text-gray-500 tabular-nums">{formatNumber(area.trees_planned)} trees</p>
    </div>
  );
}

export function ClusterBlockMatrix({ cluster }: ClusterBlockMatrixProps) {
  const matrix = buildClusterBlockMatrix(cluster);
  if (!matrix || matrix.columns.length === 0) return null;

  const colTemplate = `minmax(4.5rem,1fr) repeat(${matrix.columns.length}, minmax(4.5rem, 1fr))`;

  return (
    <div className="mt-2 mb-2 ml-8 overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <div
        className="grid gap-px bg-gray-200 text-xs min-w-max"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <div className="bg-gray-50 px-2 py-2 font-medium text-gray-500" />
        {matrix.columns.map((col) => (
          <div
            key={col.id}
            className="bg-gray-50 px-2 py-2 text-center font-semibold text-gray-700"
          >
            {col.label}
          </div>
        ))}

        {matrix.rows.map((row) => (
          <Fragment key={row.key}>
            <div className="bg-gray-50 px-2 py-2 font-medium text-gray-600 whitespace-nowrap">
              {row.label}
            </div>
            {matrix.columns.map((col) => (
              <div key={`${row.key}-${col.id}`} className="bg-white px-2 py-2">
                <MatrixCell area={getMatrixCell(matrix, col.id, row.key)} />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
