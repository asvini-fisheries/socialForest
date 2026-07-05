'use client';

import { formatNumber } from '@/lib/utils';
import { buildClusterBlockMatrix, getMatrixCell } from '@/lib/project-area-matrix';
import type { ProjectArea } from '@/types/database';

interface ClusterBlockMatrixProps {
  cluster: ProjectArea;
  saplingsByAreaId?: Map<string, number>;
}

function clusterTitle(area: ProjectArea): string {
  const fromName = area.name.match(/CLUSTER\s+([A-Z0-9]+)/i);
  if (fromName) return `Cluster ${fromName[1].toUpperCase()}`;
  if (area.code) return `Cluster ${area.code}`;
  return area.name;
}

function MatrixCell({
  area,
  saplingsByAreaId,
}: {
  area: ProjectArea | null;
  saplingsByAreaId?: Map<string, number>;
}) {
  if (!area) {
    return <span className="text-gray-300">&nbsp;</span>;
  }

  const saplings = saplingsByAreaId?.get(area.id) || 0;

  return (
    <div className="text-center leading-snug py-1">
      <p className="tabular-nums text-gray-900">{area.land_area_acres} ac</p>
      <p className="tabular-nums text-gray-700">{formatNumber(saplings)} Sap</p>
    </div>
  );
}

export function ClusterBlockMatrix({ cluster, saplingsByAreaId }: ClusterBlockMatrixProps) {
  const matrix = buildClusterBlockMatrix(cluster);
  if (!matrix || matrix.columns.length === 0) return null;

  return (
    <div className="mt-3 mb-2 ml-8 overflow-x-auto">
      <p className="text-sm font-semibold text-gray-800 mb-1">{clusterTitle(cluster)}</p>
      <table className="w-full min-w-[20rem] border-collapse border border-gray-400 text-xs bg-white">
        <thead>
          <tr>
            <th className="border border-gray-400 bg-gray-50 px-2 py-1.5 text-left font-medium text-gray-600 w-20" />
            {matrix.columns.map((col) => (
              <th
                key={col.id}
                className="border border-gray-400 bg-gray-50 px-2 py-1.5 text-center font-semibold text-gray-800"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.key}>
              <th className="border border-gray-400 bg-gray-50 px-2 py-1 text-left font-medium text-gray-700 whitespace-nowrap">
                {row.label}
              </th>
              {matrix.columns.map((col) => (
                <td key={`${row.key}-${col.id}`} className="border border-gray-400 px-2 py-1 align-middle">
                  <MatrixCell
                    area={getMatrixCell(matrix, col.id, row.key)}
                    saplingsByAreaId={saplingsByAreaId}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
