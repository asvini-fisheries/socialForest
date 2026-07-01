import { ACTIVITY_SELECT, getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const BILL_LIST_SELECT = `
  id, project_id, stakeholder_id, bill_number, period_from, period_to, total_amount, status, created_at,
  stakeholder:stakeholders(name, code)
`;

export { getServiceClient, requireProjectAccess, ACTIVITY_SELECT };
