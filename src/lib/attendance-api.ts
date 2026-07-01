import { getServiceClient, requireProjectAccess } from '@/lib/daily-activities-api';

export const ATTENDANCE_SELECT = `
  id,
  attendance_date,
  status,
  project_id,
  organisation_id,
  employee_id,
  organisation:organisations(name, code),
  employee:organisation_employees(employee_code, full_name, designation:designations(name))
`;

export { getServiceClient, requireProjectAccess };
