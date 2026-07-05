import type { ProjectArea } from '@/types/database';

export type ClusterBlockMatrix = {
  columns: { id: string; label: string }[];
  rows: { key: string; label: string }[];
  cells: Record<string, ProjectArea | null>;
};

/** e.g. A1 from code "A1-BLK-1" or name "A1 Block 3" */
export function parseSectionLabel(area: ProjectArea): string {
  if (area.code) {
    const parts = area.code.split('-');
    for (const part of parts) {
      if (/^[A-Z]\d+$/i.test(part)) return part.toUpperCase();
    }
  }
  const fromName = area.name.match(/\b([A-Z]\d+)\b/i);
  if (fromName) return fromName[1].toUpperCase();
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

export function parseBlockRowLabel(key: string, area?: ProjectArea): string {
  const match = key.match(/^block-(\d+)$/);
  if (match) return `Block ${match[1]}`;
  return area?.name || key;
}

function sortColumnLabels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function sortRowKeys(a: string, b: string): number {
  const numA = Number(a.match(/^block-(\d+)$/)?.[1] ?? 9999);
  const numB = Number(b.match(/^block-(\d+)$/)?.[1] ?? 9999);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

function cellKey(columnId: string, rowKey: string): string {
  return `${columnId}::${rowKey}`;
}

/**
 * Build A1–A5 column × Block row matrix for a level-1 cluster.
 * Supports level-2 sections with level-3 blocks, or flat blocks grouped by name prefix.
 */
export function buildClusterBlockMatrix(cluster: ProjectArea): ClusterBlockMatrix | null {
  const children = cluster.children ?? [];
  if (children.length === 0) return null;

  const hasLevel2Sections = children.some((c) => c.level === 2);
  const columns: { id: string; label: string }[] = [];
  const rowKeySet = new Set<string>();
  const cells: Record<string, ProjectArea | null> = {};

  if (hasLevel2Sections) {
    const sections = children
      .filter((c) => c.level === 2)
      .sort((a, b) => sortColumnLabels(parseSectionLabel(a), parseSectionLabel(b)));

    for (const section of sections) {
      const label = parseSectionLabel(section);
      columns.push({ id: section.id, label });

      const blocks = section.children ?? [];
      if (blocks.length === 0) {
        const rowKey = 'block-1';
        rowKeySet.add(rowKey);
        cells[cellKey(section.id, rowKey)] = section;
        continue;
      }

      for (const block of blocks) {
        const rowKey = parseBlockRowKey(block);
        rowKeySet.add(rowKey);
        cells[cellKey(section.id, rowKey)] = block;
      }
    }
  } else {
    const bySection = new Map<string, ProjectArea[]>();
    for (const block of children) {
      const section = parseSectionLabel(block);
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
        rowKeySet.add(rowKey);
        cells[cellKey(colId, rowKey)] = block;
      }
    }
  }

  if (columns.length === 0) return null;

  const rows = [...rowKeySet]
    .sort(sortRowKeys)
    .map((key) => {
      const sample = Object.values(cells).find((a) => a && parseBlockRowKey(a) === key) ?? undefined;
      return { key, label: parseBlockRowLabel(key, sample) };
    });

  return { columns, rows, cells };
}

export function getMatrixCell(
  matrix: ClusterBlockMatrix,
  columnId: string,
  rowKey: string
): ProjectArea | null {
  return matrix.cells[cellKey(columnId, rowKey)] ?? null;
}
