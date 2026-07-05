import { getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const INVOICE_LIST_SELECT = `
  id, project_id, stakeholder_id, organisation_id, invoice_number, invoice_date,
  period_from, period_to, total_amount, status, remarks, submitted_at, approved_at, created_at,
  stakeholder:stakeholders(name, code),
  organisation:organisations(name, code)
`;

export const INVOICE_DETAIL_SELECT = `
  id, project_id, stakeholder_id, organisation_id, invoice_number, invoice_date,
  period_from, period_to, total_amount, status, remarks, submitted_at, approved_at, created_at,
  stakeholder:stakeholders(name, code, gstin),
  organisation:organisations(name, code, gstin, address, city, state),
  project:projects(
    name, code,
    csr_partner:csr_partners(name, code)
  ),
  items:contractor_invoice_items(
    id, source_type, stakeholder_bill_id, contractor_expense_id, description, amount
  )
`;

export { getServiceClient, requireProjectAccess };

export function formatInvoiceNumber(projectCode: string | null | undefined, seq: number): string {
  const prefix = (projectCode || 'PRJ').replace(/\s+/g, '').slice(0, 12);
  const stamp = Date.now().toString().slice(-6);
  return `CINV-${prefix}-${stamp}${seq}`;
}
