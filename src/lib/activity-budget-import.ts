import type { SupabaseClient } from '@supabase/supabase-js';
import { type ImportRowError, sheetToRows } from '@/lib/master-excel';

type ImportResourceLine = {
  resource_id: string;
  planned_quantity: number;
  unit_rate: number;
};

type ImportBudgetGroup = {
  project_area_id: string | null;
  activity_id: string;
  planned_quantity: number | null;
  remarks: string | null;
  resources: ImportResourceLine[];
};

export type ActivityBudgetImportResult = {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportRowError[];
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function rowValue(row: Record<string, string>, header: string): string {
  const target = normalizeHeader(header);
  for (const [key, value] of Object.entries(row)) {
    if (normalizeHeader(key) === target) return String(value ?? '').trim();
  }
  return '';
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

async function loadLookupMaps(service: SupabaseClient, projectId: string) {
  const [areasRes, activitiesRes, resourcesRes] = await Promise.all([
    service
      .from('project_areas')
      .select('id, name, code')
      .eq('project_id', projectId)
      .eq('is_active', true),
    service.from('activities').select('id, name, code').eq('is_active', true),
    service.from('resources_materials').select('id, name, code').eq('is_active', true),
  ]);

  if (areasRes.error) throw new Error(areasRes.error.message);
  if (activitiesRes.error) throw new Error(activitiesRes.error.message);
  if (resourcesRes.error) throw new Error(resourcesRes.error.message);

  const areaByKey = new Map<string, string>();
  for (const area of areasRes.data || []) {
    areaByKey.set(normalizeHeader(area.name), area.id);
    if (area.code) areaByKey.set(normalizeHeader(area.code), area.id);
  }

  const activityByKey = new Map<string, string>();
  for (const activity of activitiesRes.data || []) {
    activityByKey.set(normalizeHeader(activity.name), activity.id);
    if (activity.code) activityByKey.set(normalizeHeader(activity.code), activity.id);
  }

  const resourceByKey = new Map<string, string>();
  for (const resource of resourcesRes.data || []) {
    resourceByKey.set(normalizeHeader(resource.name), resource.id);
    if (resource.code) resourceByKey.set(normalizeHeader(resource.code), resource.id);
  }

  return { areaByKey, activityByKey, resourceByKey };
}

function groupKey(areaId: string | null, activityId: string): string {
  return `${areaId ?? 'whole'}:${activityId}`;
}

export async function importActivityBudgetRows(
  service: SupabaseClient,
  projectId: string,
  buffer: ArrayBuffer
): Promise<ActivityBudgetImportResult> {
  const rawRows = sheetToRows(buffer);
  const errors: ImportRowError[] = [];
  const groups = new Map<string, ImportBudgetGroup>();

  if (!rawRows.length) {
    return { totalRows: 0, successCount: 0, errorCount: 1, errors: [{ row: 1, column: 'File', value: '', message: 'Excel file has no data rows' }] };
  }

  const { areaByKey, activityByKey, resourceByKey } = await loadLookupMaps(service, projectId);

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const areaText = rowValue(row, 'Project Area');
    const activityText = rowValue(row, 'Activity');
    const resourceText = rowValue(row, 'Resource');
    const resourceQtyText = rowValue(row, 'Resource Qty');
    const unitRateText = rowValue(row, 'Unit Rate');
    const plannedQtyText = rowValue(row, 'Planned Qty');
    const remarks = rowValue(row, 'Remarks') || null;

    if (!activityText) {
      errors.push({ row: rowNum, column: 'Activity', value: activityText, message: 'Activity is required' });
      return;
    }
    if (!resourceText) {
      errors.push({ row: rowNum, column: 'Resource', value: resourceText, message: 'Resource is required' });
      return;
    }

    const activityId = activityByKey.get(normalizeHeader(activityText));
    if (!activityId) {
      errors.push({ row: rowNum, column: 'Activity', value: activityText, message: 'Activity not found' });
      return;
    }

    let projectAreaId: string | null = null;
    if (areaText && normalizeHeader(areaText) !== 'whole project') {
      projectAreaId = areaByKey.get(normalizeHeader(areaText)) || null;
      if (!projectAreaId) {
        errors.push({ row: rowNum, column: 'Project Area', value: areaText, message: 'Project area not found in this project' });
        return;
      }
    }

    const resourceId = resourceByKey.get(normalizeHeader(resourceText));
    if (!resourceId) {
      errors.push({ row: rowNum, column: 'Resource', value: resourceText, message: 'Resource not found' });
      return;
    }

    const resourceQty = parseNumber(resourceQtyText);
    if (resourceQty == null || resourceQty <= 0) {
      errors.push({ row: rowNum, column: 'Resource Qty', value: resourceQtyText, message: 'Resource Qty must be a positive number' });
      return;
    }

    const unitRate = parseNumber(unitRateText);
    if (unitRate == null || unitRate < 0) {
      errors.push({ row: rowNum, column: 'Unit Rate', value: unitRateText, message: 'Unit Rate must be zero or greater' });
      return;
    }

    const plannedQuantity = parseNumber(plannedQtyText);
    const key = groupKey(projectAreaId, activityId);
    if (!groups.has(key)) {
      groups.set(key, {
        project_area_id: projectAreaId,
        activity_id: activityId,
        planned_quantity: plannedQuantity,
        remarks,
        resources: [],
      });
    }

    const group = groups.get(key)!;
    if (plannedQuantity != null) group.planned_quantity = plannedQuantity;
    if (remarks) group.remarks = remarks;

    const duplicate = group.resources.find((item) => item.resource_id === resourceId);
    if (duplicate) {
      duplicate.planned_quantity += resourceQty;
      duplicate.unit_rate = unitRate;
    } else {
      group.resources.push({
        resource_id: resourceId,
        planned_quantity: resourceQty,
        unit_rate: unitRate,
      });
    }
  });

  if (errors.length) {
    return {
      totalRows: rawRows.length,
      successCount: 0,
      errorCount: errors.length,
      errors,
    };
  }

  let successCount = 0;

  for (const group of groups.values()) {
    let query = service
      .from('project_area_activity_budgets')
      .select('id')
      .eq('project_id', projectId)
      .eq('activity_id', group.activity_id);

    query = group.project_area_id
      ? query.eq('project_area_id', group.project_area_id)
      : query.is('project_area_id', null);

    const { data: existing } = await query.maybeSingle();

    let budgetId = existing?.id as string | undefined;

    if (budgetId) {
      const { error: updateErr } = await service
        .from('project_area_activity_budgets')
        .update({
          planned_quantity: group.planned_quantity,
          remarks: group.remarks,
        })
        .eq('id', budgetId);
      if (updateErr) {
        errors.push({ row: 0, column: 'Budget', value: budgetId, message: updateErr.message });
        continue;
      }
      await service.from('project_area_activity_budget_items').delete().eq('budget_id', budgetId);
    } else {
      const { data: created, error: createErr } = await service
        .from('project_area_activity_budgets')
        .insert({
          project_id: projectId,
          project_area_id: group.project_area_id,
          activity_id: group.activity_id,
          planned_quantity: group.planned_quantity,
          remarks: group.remarks,
        })
        .select('id')
        .single();
      if (createErr || !created) {
        errors.push({ row: 0, column: 'Budget', value: group.activity_id, message: createErr?.message || 'Create failed' });
        continue;
      }
      budgetId = created.id;
    }

    const { error: itemsErr } = await service.from('project_area_activity_budget_items').insert(
      group.resources.map((item) => ({
        budget_id: budgetId,
        resource_id: item.resource_id,
        planned_quantity: item.planned_quantity,
        unit_rate: item.unit_rate,
      }))
    );

    if (itemsErr) {
      errors.push({ row: 0, column: 'Resources', value: budgetId!, message: itemsErr.message });
      continue;
    }

    successCount += group.resources.length;
  }

  return {
    totalRows: rawRows.length,
    successCount,
    errorCount: errors.length,
    errors,
  };
}
