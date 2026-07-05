import { budgetAmount, budgetResourceAmount } from '@/lib/activity-budget-metrics';
import type { ImportColumnSpec } from '@/lib/master-types';

import { budgetParentAreaText, budgetProjectAreaText, type ActivityBudgetListRow } from '@/lib/activity-budget-display';

export const ACTIVITY_BUDGET_EXPORT_COLUMNS = [
  { key: 'parent_area', header: 'Parent Area' },
  { key: 'project_area', header: 'Project Area' },
  { key: 'activity', header: 'Activity' },
  { key: 'planned_quantity', header: 'Planned Qty' },
  { key: 'resource', header: 'Resource' },
  { key: 'resource_qty', header: 'Resource Qty' },
  { key: 'unit_rate', header: 'Unit Rate' },
  { key: 'line_amount', header: 'Line Amount' },
  { key: 'budget_total', header: 'Budget Total' },
  { key: 'remarks', header: 'Remarks' },
];

export const ACTIVITY_BUDGET_IMPORT_COLUMNS: ImportColumnSpec[] = [
  { key: 'project_area', header: 'Project Area', type: 'text' },
  { key: 'activity', header: 'Activity', type: 'text', required: true },
  { key: 'planned_quantity', header: 'Planned Qty', type: 'number' },
  { key: 'resource', header: 'Resource', type: 'text', required: true },
  { key: 'resource_qty', header: 'Resource Qty', type: 'number', required: true },
  { key: 'unit_rate', header: 'Unit Rate', type: 'number', required: true },
  { key: 'remarks', header: 'Remarks', type: 'text' },
];

export function flattenActivityBudgetsForExport(budgets: ActivityBudgetListRow[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  for (const budget of budgets) {
    const parentArea = budgetParentAreaText(budget);
    const areaName = budgetProjectAreaText(budget);
    const activityName = budget.activity?.name || '';
    const headerQty = budget.planned_quantity ?? '';
    const remarks = budget.remarks || '';
    const total = budgetAmount(budget);
    const resources = budget.resources || [];

    if (!resources.length) {
      rows.push({
        parent_area: parentArea,
        project_area: areaName,
        activity: activityName,
        planned_quantity: headerQty,
        resource: '',
        resource_qty: '',
        unit_rate: '',
        line_amount: '',
        budget_total: total,
        remarks,
      });
      continue;
    }

    for (const item of resources) {
      rows.push({
        parent_area: parentArea,
        project_area: areaName,
        activity: activityName,
        planned_quantity: headerQty,
        resource: item.resource?.name || '',
        resource_qty: item.planned_quantity,
        unit_rate: item.unit_rate ?? 0,
        line_amount: budgetResourceAmount({
          planned_quantity: item.planned_quantity,
          unit_rate: item.unit_rate,
        }),
        budget_total: total,
        remarks,
      });
    }
  }

  return rows;
}
