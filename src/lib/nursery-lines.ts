export type InwardDetailLine = {
  line_id: string;
  bill_id: string;
  bill_date: string;
  invoice_number: string;
  status: string;
  stakeholder_id: string;
  stakeholder_name: string;
  stakeholder_code: string | null;
  resource_id: string;
  species_name: string;
  species_code: string | null;
  quantity: number;
  unit_rate: number;
  amount: number;
};

export type OutwardDetailLine = {
  line_id: string;
  bill_id: string;
  issue_date: string;
  log_number: string;
  issue_category: string;
  project_area_id: string | null;
  project_area_name: string;
  project_area_code: string | null;
  resource_id: string;
  species_name: string;
  species_code: string | null;
  quantity: number;
};

type InwardBillRow = {
  id: string;
  bill_date: string;
  invoice_number: string;
  status?: string;
  stakeholder_id: string;
  stakeholder?: { name?: string; code?: string | null } | null;
  items?: {
    id: string;
    resource_id: string;
    quantity: number;
    unit_rate: number;
    amount: number;
    resource?: { name?: string; code?: string | null } | null;
  }[];
};

type OutwardBillRow = {
  id: string;
  issue_date: string;
  log_number: string | null;
  issue_category: string;
  project_area_id?: string | null;
  project_area?: { name?: string; code?: string | null } | null;
  items?: {
    id: string;
    resource_id: string;
    quantity: number;
    resource?: { name?: string; code?: string | null } | null;
  }[];
};

export function flattenInwardBillsToLines(bills: InwardBillRow[]): InwardDetailLine[] {
  const lines: InwardDetailLine[] = [];
  for (const bill of bills) {
    for (const item of bill.items || []) {
      lines.push({
        line_id: item.id,
        bill_id: bill.id,
        bill_date: bill.bill_date,
        invoice_number: bill.invoice_number,
        status: bill.status || 'draft',
        stakeholder_id: bill.stakeholder_id,
        stakeholder_name: bill.stakeholder?.name || '',
        stakeholder_code: bill.stakeholder?.code || null,
        resource_id: item.resource_id,
        species_name: item.resource?.name || '',
        species_code: item.resource?.code || null,
        quantity: item.quantity,
        unit_rate: item.unit_rate,
        amount: item.amount,
      });
    }
  }
  return lines;
}

export function flattenOutwardBillsToLines(bills: OutwardBillRow[]): OutwardDetailLine[] {
  const lines: OutwardDetailLine[] = [];
  for (const bill of bills) {
    for (const item of bill.items || []) {
      lines.push({
        line_id: item.id,
        bill_id: bill.id,
        issue_date: bill.issue_date,
        log_number: bill.log_number || '',
        issue_category: bill.issue_category,
        project_area_id: bill.project_area_id || null,
        project_area_name: bill.project_area?.name || '',
        project_area_code: bill.project_area?.code || null,
        resource_id: item.resource_id,
        species_name: item.resource?.name || '',
        species_code: item.resource?.code || null,
        quantity: item.quantity,
      });
    }
  }
  return lines;
}
