import type { ProjectArea } from '@/types/database';

/** Build a parent → children tree from a flat project_areas list. */
export function buildProjectAreaTree(areas: ProjectArea[]): ProjectArea[] {
  const nodes = new Map<string, ProjectArea>();

  for (const area of areas) {
    nodes.set(area.id, { ...area, children: [] });
  }

  const roots: ProjectArea[] = [];

  for (const area of areas) {
    const node = nodes.get(area.id)!;
    if (area.parent_area_id && nodes.has(area.parent_area_id)) {
      nodes.get(area.parent_area_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: ProjectArea[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((node) => {
      if (node.children?.length) sortNodes(node.children);
    });
  };

  sortNodes(roots);
  return roots;
}
