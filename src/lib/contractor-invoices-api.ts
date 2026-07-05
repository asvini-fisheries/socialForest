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
  organisation:organisations(name, code, gstin, address, city, state, header_template, footer_template),
  project:projects(
    name, code,
    csr_partner:csr_partners(name, code)
  ),
  items:contractor_invoice_items(
    id, source_type, stakeholder_bill_id, contractor_expense_id, description, amount,
    stakeholder_bill:stakeholder_bills(
      id, bill_number,
      items:stakeholder_bill_items(
        id, description, daily_activity_id,
        daily_activity:daily_activity_updates(
          id, activity_date,
          images:daily_activity_images(id, image_url, caption)
        )
      )
    ),
    contractor_expense:contractor_expenses(
      id, expense_date, category, description,
      attachments:contractor_expense_attachments(id, file_url, file_name)
    )
  )
`;

export { getServiceClient, requireProjectAccess };

export function formatInvoiceNumber(projectCode: string | null | undefined, seq: number): string {
  const prefix = (projectCode || 'PRJ').replace(/\s+/g, '').slice(0, 12);
  const stamp = Date.now().toString().slice(-6);
  return `CINV-${prefix}-${stamp}${seq}`;
}
