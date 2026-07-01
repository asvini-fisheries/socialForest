import { getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const INWARD_BILL_SELECT = `
  id, project_id, stakeholder_id, invoice_number, bill_date, image_url, remarks, total_amount,
  status, submitted_at, approved_at, created_at,
  stakeholder:stakeholders(name, code, address, city, state, gstin),
  project:projects(
    name, code,
    organisation:organisations(name, address, city, state, gstin, header_template, footer_template)
  ),
  items:nursery_inward_items(
    id, resource_id, quantity, unit_rate, amount,
    resource:resources_materials(name, code)
  )
`;

export const OUTWARD_BILL_SELECT = `
  id, project_id, project_area_id, issue_category, log_number, issue_date, image_url, remarks, total_amount, created_at,
  project_area:project_areas(name, code),
  project:projects(
    name, code,
    organisation:organisations(name, address, city, state, gstin, header_template, footer_template)
  ),
  items:nursery_outward_items(
    id, resource_id, quantity, unit_rate, amount,
    resource:resources_materials(name, code)
  )
`;

export const INWARD_LIST_SELECT = `
  id, project_id, stakeholder_id, invoice_number, bill_date, image_url, remarks, total_amount, status, created_at,
  stakeholder:stakeholders(name, code)
`;

export const OUTWARD_LIST_SELECT = `
  id, project_id, project_area_id, issue_category, log_number, issue_date, remarks, created_at,
  project_area:project_areas(name, code)
`;

export const INWARD_LINES_BILL_SELECT = `
  id, bill_date, invoice_number, stakeholder_id, status,
  stakeholder:stakeholders(name, code),
  items:nursery_inward_items(
    id, resource_id, quantity, unit_rate, amount,
    resource:resources_materials(name, code)
  )
`;

export const OUTWARD_LINES_BILL_SELECT = `
  id, issue_date, log_number, issue_category, project_area_id,
  project_area:project_areas(name, code),
  items:nursery_outward_items(
    id, resource_id, quantity,
    resource:resources_materials(name, code)
  )
`;

export { getServiceClient, requireProjectAccess };
