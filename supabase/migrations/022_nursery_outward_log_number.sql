-- Outward: use log_number instead of reference_number; project area focused issue log

ALTER TABLE nursery_outward_bills RENAME COLUMN reference_number TO log_number;

COMMENT ON COLUMN nursery_outward_bills.log_number IS 'Outward issue log / challan number';
COMMENT ON COLUMN nursery_outward_bills.project_area_id IS 'Project area where saplings are issued';
