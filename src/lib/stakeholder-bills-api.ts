import { ACTIVITY_SELECT, getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const BILL_LIST_SELECT = `
  id, project_id, stakeholder_id, bill_number, period_from, period_to, total_amount, status, created_at,
  submitted_at, approved_at,
  stakeholder:stakeholders(name, code)
`;

export const BILL_DETAIL_SELECT = `
  id, project_id, stakeholder_id, bill_number, period_from, period_to, total_amount, status,
  remarks, submitted_at, approved_at, created_at,
  stakeholder:stakeholders(name, code, address, city, state, pincode, gstin, pan, contact_person, mobile),
  project:projects(
    name, code, location, district, state,
    organisation:organisations(name, code, address, city, state, pincode, gstin, pan, header_template, footer_template)
  ),
  items:stakeholder_bill_items(
    id, daily_activity_id, description, quantity, unit_rate, amount
  )
`;

export { getServiceClient, requireProjectAccess, ACTIVITY_SELECT };
