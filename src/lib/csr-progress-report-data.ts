import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildPlannedClusterActivityMap,
  buildRolledUpBudgetSummariesByArea,
  getPlannedClusterTotals,
  sumProjectBudgetAmount,
  type ActivityBudgetRow,
} from '@/lib/activity-budget-comparison';
import { ACTIVITY_SELECT, getServiceClient } from '@/lib/daily-activities-api';
import { BUDGET_SELECT } from '@/lib/activity-budgets-api';
import {
  sumActivityAmount,
  sumTreePlantationSpeciesQuantity,
  treePlantationSpeciesQuantity,
  treeSpeciesQuantity,
} from '@/lib/daily-activity-metrics';
import {
  buildActivityTreeByCluster,
  buildRolledUpSummariesByArea,
  type ClusterActivityTree,
  type DailyActivityAreaRow,
} from '@/lib/project-activity-summaries';
import type { ProjectArea } from '@/types/database';

export type CsrBudgetActualMetrics = {
  budgetAmount: number;
  actualAmount: number;
  progressPct: number;
};

export type CsrActivityBudgetActual = CsrBudgetActualMetrics & {
  activityName: string;
};

export type CsrClusterBudgetActual = CsrBudgetActualMetrics & {
  areaId: string;
  areaName: string;
  areaCode: string | null;
  activities: CsrActivityBudgetActual[];
};

export type CsrProgressClusterBlock = {
  areaId: string;
  areaName: string;
  areaCode: string | null;
  landAcres: number;
  treesPlanned: number;
  treesPlanted: number;
  saplings: number;
  amount: number;
  progressPct: number;
};

export type CsrProgressCluster = {
  areaId: string;
  areaName: string;
  areaCode: string | null;
  landAcres: number;
  treesPlanned: number;
  treesPlanted: number;
  saplings: number;
  amount: number;
  progressPct: number;
  blocks: CsrProgressClusterBlock[];
};

export type CsrProgressReportData = {
  projectName: string;
  projectCode: string | null;
  projectStatus: string;
  reportDate: string;
  financialYear: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  location: string | null;
  organisationName: string;
  csrPartnerName: string;
  summary: {
    treesPlanned: number;
    treesPlanted: number;
    treeProgressPct: number;
    landAcres: number;
    budgetAmount: number;
    budgetActual: number;
    budgetProgressPct: number;
    totalSaplings: number;
    totalAmount: number;
    hasActivityBudgets: boolean;
  };
  clusterBudgetActuals: CsrClusterBudgetActual[];
  activityBudgetActuals: CsrActivityBudgetActual[];
  clusters: CsrProgressCluster[];
  activityTree: ClusterActivityTree[];
};

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.min(100, (numerator / denominator) * 100);
}

function clusterRootId(areaId: string | null, areaById: Map<string, ProjectArea>): string | null {
  if (!areaId) return null;
  let current: string | null = areaId;
  while (current) {
    const area = areaById.get(current);
    if (!area || area.level === 1 || !area.parent_area_id) return current;
    current = area.parent_area_id;
  }
  return areaId;
}

function sumTreesPlantedForArea(
  entries: DailyActivityAreaRow[],
  areaId: string,
  areaById: Map<string, ProjectArea>
): number {
  return entries.reduce((sum, entry) => {
    const rootId = clusterRootId(entry.project_area_id, areaById);
    if (entry.project_area_id === areaId || rootId === areaId) {
      return sum + treePlantationSpeciesQuantity(entry);
    }
    return sum;
  }, 0);
}

function sumSaplingsForArea(
  entries: DailyActivityAreaRow[],
  areaId: string,
  areaById: Map<string, ProjectArea>,
  parentById: Map<string, string | null>
): number {
  return entries.reduce((sum, entry) => {
    if (!entry.project_area_id) return sum;
    const ancestors = new Set<string>();
    let current: string | null = entry.project_area_id;
    while (current) {
      ancestors.add(current);
      current = parentById.get(current) ?? null;
    }
    if (!ancestors.has(areaId)) return sum;
    return sum + treeSpeciesQuantity(entry);
  }, 0);
}

function filterEntriesByPeriod(
  entries: DailyActivityAreaRow[],
  periodFrom?: string | null,
  periodTo?: string | null
): DailyActivityAreaRow[] {
  if (!periodFrom && !periodTo) return entries;
  return entries.filter((entry) => {
    const date = entry.activity_date || '';
    if (!date) return false;
    if (periodFrom && date < periodFrom) return false;
    if (periodTo && date > periodTo) return false;
    return true;
  });
}

function buildClusterBudgetActuals(
  areas: ProjectArea[],
  entries: DailyActivityAreaRow[],
  budgets: ActivityBudgetRow[]
): CsrClusterBudgetActual[] {
  const rolledUpActual = buildRolledUpSummariesByArea(areas, entries);
  const rolledUpBudget = buildRolledUpBudgetSummariesByArea(areas, budgets);
  const plannedMap = buildPlannedClusterActivityMap(areas, budgets);
  const activityTree = buildActivityTreeByCluster(areas, entries);

  return areas
    .filter((area) => area.level === 1)
    .sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name, undefined, { numeric: true }))
    .map((cluster) => {
      const budgetSummary = rolledUpBudget.get(cluster.id);
      const actualSummary = rolledUpActual.get(cluster.id);
      const clusterTree = activityTree.find((tree) => tree.areaId === cluster.id);
      const clusterPlanned = getPlannedClusterTotals(plannedMap, cluster.id);

      const activityNames = new Set<string>();
      budgetSummary?.lines.forEach((line) => activityNames.add(line.activityName));
      clusterTree?.activities.forEach((activity) => activityNames.add(activity.activityName));

      const activities = [...activityNames]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map((activityName) => {
          const planned =
            plannedMap.get(`${cluster.id}:${activityName}`) || { quantity: 0, saplings: 0, amount: 0 };
          const actualActivity = clusterTree?.activities.find(
            (activity) => activity.activityName === activityName
          );
          const budgetAmount = planned.amount;
          const actualAmount = actualActivity?.amount || 0;
          return {
            activityName,
            budgetAmount,
            actualAmount,
            progressPct: pct(actualAmount, budgetAmount),
          };
        });

      const budgetAmount = budgetSummary?.totalPlannedAmount || clusterPlanned.amount;
      const actualAmount = actualSummary?.totalAmount || clusterTree?.amount || 0;

      return {
        areaId: cluster.id,
        areaName: cluster.name,
        areaCode: cluster.code,
        budgetAmount,
        actualAmount,
        progressPct: pct(actualAmount, budgetAmount),
        activities,
      };
    });
}

function buildProjectActivityBudgetActuals(
  clusterBudgetActuals: CsrClusterBudgetActual[]
): CsrActivityBudgetActual[] {
  const byActivity = new Map<string, { budgetAmount: number; actualAmount: number }>();

  for (const cluster of clusterBudgetActuals) {
    for (const activity of cluster.activities) {
      const prev = byActivity.get(activity.activityName) || { budgetAmount: 0, actualAmount: 0 };
      byActivity.set(activity.activityName, {
        budgetAmount: prev.budgetAmount + activity.budgetAmount,
        actualAmount: prev.actualAmount + activity.actualAmount,
      });
    }
  }

  return [...byActivity.entries()]
    .map(([activityName, values]) => ({
      activityName,
      budgetAmount: values.budgetAmount,
      actualAmount: values.actualAmount,
      progressPct: pct(values.actualAmount, values.budgetAmount),
    }))
    .sort((a, b) => a.activityName.localeCompare(b.activityName, undefined, { numeric: true }));
}

export function buildCsrProgressReportData(input: {
  project: {
    name: string;
    code: string | null;
    status: string;
    total_land_area_acres: number;
    total_trees_planned: number;
    budget_amount: number;
    location: string | null;
    district: string | null;
    state: string | null;
    start_date: string | null;
    end_date: string | null;
    year?: { year_label?: string | null } | null;
    organisation?: { name?: string | null } | null;
    csr_partner?: { name?: string | null } | null;
  };
  areas: ProjectArea[];
  entries: DailyActivityAreaRow[];
  budgets?: ActivityBudgetRow[];
  periodFrom?: string | null;
  periodTo?: string | null;
}): CsrProgressReportData {
  const { project, areas } = input;
  const budgets = input.budgets || [];
  const entries = filterEntriesByPeriod(input.entries, input.periodFrom, input.periodTo);
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const parentById = new Map(areas.map((area) => [area.id, area.parent_area_id]));
  const activityTree = buildActivityTreeByCluster(areas, entries);
  const rolledUp = buildRolledUpSummariesByArea(areas, entries);
  const treesPlanted = sumTreePlantationSpeciesQuantity(entries);
  const budgetActual = sumActivityAmount(entries);
  const totalSaplings = entries.reduce((sum, entry) => sum + treeSpeciesQuantity(entry), 0);

  const clusters = areas
    .filter((area) => area.level === 1)
    .sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name, undefined, { numeric: true }))
    .map((cluster) => {
      const blocks = areas
        .filter((area) => area.parent_area_id === cluster.id && area.level === 2)
        .sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name, undefined, { numeric: true }))
        .map((block) => {
          const blockTreesPlanted = sumTreesPlantedForArea(entries, block.id, areaById);
          const blockSummary = rolledUp.get(block.id);
          const blockSaplings = blockSummary?.totalSaplings || sumSaplingsForArea(entries, block.id, areaById, parentById);
          const blockAmount = blockSummary?.totalAmount || 0;

          return {
            areaId: block.id,
            areaName: block.name,
            areaCode: block.code,
            landAcres: Number(block.land_area_acres) || 0,
            treesPlanned: block.trees_planned || 0,
            treesPlanted: blockTreesPlanted,
            saplings: blockSaplings,
            amount: blockAmount,
            progressPct: pct(blockTreesPlanted, block.trees_planned || 0),
          };
        });

      const clusterFromTree = activityTree.find((tree) => tree.areaId === cluster.id);
      const clusterSummary = rolledUp.get(cluster.id);
      const clusterAmount = clusterSummary?.totalAmount || clusterFromTree?.amount || 0;
      const clusterSaplings = clusterSummary?.totalSaplings || clusterFromTree?.saplings || 0;
      const clusterTreesPlanted = sumTreesPlantedForArea(entries, cluster.id, areaById);

      return {
        areaId: cluster.id,
        areaName: cluster.name,
        areaCode: cluster.code,
        landAcres: Number(cluster.land_area_acres) || 0,
        treesPlanned: cluster.trees_planned || 0,
        treesPlanted: clusterTreesPlanted,
        saplings: clusterSaplings,
        amount: clusterAmount,
        progressPct: pct(clusterTreesPlanted, cluster.trees_planned || 0),
        blocks,
      };
    });

  const location = [project.location, project.district, project.state].filter(Boolean).join(', ') || null;
  const activityBudgetTotal = sumProjectBudgetAmount(budgets);
  const hasActivityBudgets = activityBudgetTotal > 0;
  const displayBudgetAmount = hasActivityBudgets
    ? activityBudgetTotal
    : Number(project.budget_amount) || 0;
  const clusterBudgetActuals = buildClusterBudgetActuals(areas, entries, budgets);
  const activityBudgetActuals = buildProjectActivityBudgetActuals(clusterBudgetActuals);

  return {
    projectName: project.name,
    projectCode: project.code,
    projectStatus: project.status,
    reportDate: new Date().toISOString().slice(0, 10),
    financialYear: project.year?.year_label || null,
    periodFrom: input.periodFrom || project.start_date,
    periodTo: input.periodTo || project.end_date,
    location,
    organisationName: project.organisation?.name || 'Organisation',
    csrPartnerName: project.csr_partner?.name || 'CSR Partner',
    summary: {
      treesPlanned: project.total_trees_planned || 0,
      treesPlanted,
      treeProgressPct: pct(treesPlanted, project.total_trees_planned || 0),
      landAcres: Number(project.total_land_area_acres) || 0,
      budgetAmount: displayBudgetAmount,
      budgetActual,
      budgetProgressPct: pct(budgetActual, displayBudgetAmount),
      totalSaplings,
      totalAmount: budgetActual,
      hasActivityBudgets,
    },
    clusterBudgetActuals,
    activityBudgetActuals,
    clusters,
    activityTree,
  };
}

export async function loadCsrProgressReportData(
  projectId: string,
  options?: { periodFrom?: string | null; periodTo?: string | null }
): Promise<CsrProgressReportData> {
  const service = getServiceClient();
  const [projectRes, areasRes, entriesRes, budgetsRes] = await Promise.all([
    service
      .from('projects')
      .select(
        `
        name, code, status, total_land_area_acres, total_trees_planned, budget_amount,
        location, district, state, start_date, end_date,
        year:years(year_label),
        organisation:organisations(name),
        csr_partner:csr_partners(name)
      `
      )
      .eq('id', projectId)
      .single(),
    service
      .from('project_areas')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('level')
      .order('name'),
    service
      .from('daily_activity_updates')
      .select(ACTIVITY_SELECT)
      .eq('project_id', projectId)
      .order('activity_date', { ascending: false }),
    service
      .from('project_area_activity_budgets')
      .select(BUDGET_SELECT)
      .eq('project_id', projectId)
      .eq('is_active', true),
  ]);

  if (projectRes.error || !projectRes.data) {
    throw new Error(projectRes.error?.message || 'Project not found');
  }
  if (areasRes.error) throw new Error(areasRes.error.message);
  if (entriesRes.error) throw new Error(entriesRes.error.message);
  if (budgetsRes.error) throw new Error(budgetsRes.error.message);

  const projectRow = projectRes.data as {
    name: string;
    code: string | null;
    status: string;
    total_land_area_acres: number;
    total_trees_planned: number;
    budget_amount: number;
    location: string | null;
    district: string | null;
    state: string | null;
    start_date: string | null;
    end_date: string | null;
    year?: { year_label?: string | null } | { year_label?: string | null }[] | null;
    organisation?: { name?: string | null } | { name?: string | null }[] | null;
    csr_partner?: { name?: string | null } | { name?: string | null }[] | null;
  };

  const year = Array.isArray(projectRow.year) ? projectRow.year[0] : projectRow.year;
  const organisation = Array.isArray(projectRow.organisation)
    ? projectRow.organisation[0]
    : projectRow.organisation;
  const csrPartner = Array.isArray(projectRow.csr_partner)
    ? projectRow.csr_partner[0]
    : projectRow.csr_partner;

  return buildCsrProgressReportData({
    project: {
      ...projectRow,
      year: year || null,
      organisation: organisation || null,
      csr_partner: csrPartner || null,
    },
    areas: (areasRes.data || []) as ProjectArea[],
    entries: (entriesRes.data || []) as DailyActivityAreaRow[],
    budgets: (budgetsRes.data || []) as ActivityBudgetRow[],
    periodFrom: options?.periodFrom,
    periodTo: options?.periodTo,
  });
}

export async function requireCsrProgressAccess(projectId: string, request?: NextRequest) {
  const supabase = await createClient();
  let user = null;

  const bearer = request?.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    const { data, error } = await supabase.auth.getUser(bearer.slice(7));
    if (!error && data.user) user = data.user;
  }

  if (!user) {
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser();
    user = cookieUser;
  }

  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: profile } = await supabase
    .from('users')
    .select('role, csr_partner_id, organisation_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { error: 'User profile not found', status: 403 as const };
  if (profile.role === 'admin') return { user, role: profile.role };

  const { data: project } = await getServiceClient()
    .from('projects')
    .select('id, organisation_id, csr_partner_id')
    .eq('id', projectId)
    .single();

  if (!project) return { error: 'Project not found', status: 404 as const };

  if (profile.role === 'csr_partner') {
    if (!profile.csr_partner_id || project.csr_partner_id !== profile.csr_partner_id) {
      return { error: 'Forbidden', status: 403 as const };
    }
    return { user, role: profile.role, project };
  }

  if (profile.role === 'organisation') {
    if (!profile.organisation_id || project.organisation_id !== profile.organisation_id) {
      return { error: 'Forbidden', status: 403 as const };
    }
    return { user, role: profile.role, project };
  }

  return { error: 'Forbidden', status: 403 as const };
}
