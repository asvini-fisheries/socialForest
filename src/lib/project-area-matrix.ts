import type { ProjectArea } from '@/types/database';

export type ClusterBlockMatrix = {
  columns: { id: string; label: string }[];
  rows: { key: string; label: string }[];
  cells: Record<string, ProjectArea | null>;
};

/** Cluster letter from name "CLUSTER A" or code "A" */
export function parseClusterLetter(cluster: ProjectArea): string {
  const fromName = cluster.name.match(/CLUSTER\s+([A-Z])/i);
  if (fromName) return fromName[1].toUpperCase();
  if (cluster.code && /^[A-Z]$/i.test(cluster.code.trim())) return cluster.code.trim().toUpperCase();
  if (cluster.code) {
    const match = cluster.code.match(/^([A-Z])/i);
    if (match) return match[1].toUpperCase();
  }
  return 'A';
}

/** e.g. A1 from code "A1-BLK-1" or name "A1 Block 3" */
export function parseSectionLabel(
  area: ProjectArea,
  cluster?: ProjectArea,
  sectionIndex?: number
): string {
  if (area.code) {
    const parts = area.code.split('-');
    for (const part of parts) {
      if (/^[A-Z]\d+$/i.test(part)) return part.toUpperCase();
    }
  }
  const fromName = area.name.match(/\b([A-Z]\d+)\b/i);
  if (fromName) return fromName[1].toUpperCase();
  if (cluster && sectionIndex !== undefined) {
    return `${parseClusterLetter(cluster)}${sectionIndex + 1}`;
  }
  return (area.code || area.name).slice(0, 8);
}

/** e.g. "Block 7" from "A1 Block 7" or code "A1-BLK-7" */
export function parseBlockRowKey(area: ProjectArea): string {
  const fromName = area.name.match(/Block\s*(\d+)/i);
  if (fromName) return `block-${fromName[1]}`;
  const fromCode = area.code?.match(/BLK-?(\d+)/i);
  if (fromCode) return `block-${fromCode[1]}`;
  return `area-${area.id}`;
}

function sortColumnLabels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function cellKey(columnId: string, rowKey: string): string {
  return `${columnId}::${rowKey}`;
}

export const CLUSTER_BLOCK_ROW_COUNT = 9;

export function defaultBlockRows(): { key: string; label: string }[] {
  return Array.from({ length: CLUSTER_BLOCK_ROW_COUNT }, (_, index) => {
    const n = index + 1;
    return { key: `block-${n}`, label: `Block ${n}` };
  });
}

/**
 * Build column × Block row matrix for a level-1 cluster.
 * Supports level-2 sections with level-3 blocks, or flat blocks grouped by name prefix.
 */
export function buildClusterBlockMatrix(cluster: ProjectArea): ClusterBlockMatrix | null {
  const children = cluster.children ?? [];
  if (children.length === 0) return null;

  const hasLevel2Sections = children.some((c) => c.level === 2);
  const columns: { id: string; label: string }[] = [];
  const cells: Record<string, ProjectArea | null> = {};

  if (hasLevel2Sections) {
    const sections = children
      .filter((c) => c.level === 2)
      .sort((a, b) => sortColumnLabels(parseSectionLabel(a, cluster), parseSectionLabel(b, cluster)));

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      const label = parseSectionLabel(section, cluster, sectionIndex);
      columns.push({ id: section.id, label });

      const blocks = section.children ?? [];
      if (blocks.length === 0) {
        cells[cellKey(section.id, 'block-1')] = section;
        continue;
      }

      for (const block of blocks) {
        const rowKey = parseBlockRowKey(block);
        cells[cellKey(section.id, rowKey)] = block;
      }
    }
  } else {
    const bySection = new Map<string, ProjectArea[]>();
    for (const block of children) {
      const section = parseSectionLabel(block, cluster);
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section)!.push(block);
    }

    const sectionLabels = [...bySection.keys()].sort(sortColumnLabels);
    for (const label of sectionLabels) {
      const blocks = bySection.get(label)!;
      const colId = `col-${label}`;
      columns.push({ id: colId, label });

      for (const block of blocks) {
        const rowKey = parseBlockRowKey(block);
        cells[cellKey(colId, rowKey)] = block;
      }
    }
  }

  if (columns.length === 0) return null;

  return { columns, rows: defaultBlockRows(), cells };
}

export function getMatrixCell(
  matrix: ClusterBlockMatrix,
  columnId: string,
  rowKey: string
): ProjectArea | null {
  return matrix.cells[cellKey(columnId, rowKey)] ?? null;
}
