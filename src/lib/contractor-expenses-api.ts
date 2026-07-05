import { getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const EXPENSE_SELECT = `
  id, project_id, stakeholder_id, expense_date, category, description, amount,
  vendor_name, invoice_number, remarks, created_at,
  stakeholder:stakeholders(name, code),
  attachments:contractor_expense_attachments(id, file_url, file_name)
`;

export const EXPENSE_LIST_SELECT = `
  id, project_id, stakeholder_id, expense_date, category, description, amount,
  vendor_name, invoice_number, remarks, created_at,
  stakeholder:stakeholders(name, code)
`;

export { getServiceClient, requireProjectAccess };
