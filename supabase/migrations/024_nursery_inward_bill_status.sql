-- Inward bill approval workflow; stock counts approved inward only

ALTER TABLE nursery_inward_bills
  ADD COLUMN IF NOT EXISTS status bill_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Existing bills were already affecting stock — mark as approved
UPDATE nursery_inward_bills SET status = 'approved' WHERE status = 'draft';

DROP VIEW IF EXISTS nursery_stock;

CREATE VIEW nursery_stock AS
SELECT
  x.project_id,
  rm.id AS resource_id,
  rm.name AS resource_name,
  rm.code AS resource_code,
  COALESCE(SUM(x.inward_qty), 0)::INTEGER AS total_inward,
  COALESCE(SUM(x.outward_qty), 0)::INTEGER AS total_issued,
  (COALESCE(SUM(x.inward_qty), 0) - COALESCE(SUM(x.outward_qty), 0))::INTEGER AS current_stock
FROM (
  SELECT b.project_id, i.resource_id, i.quantity AS inward_qty, 0 AS outward_qty
  FROM nursery_inward_bills b
  JOIN nursery_inward_items i ON i.bill_id = b.id
  WHERE b.status = 'approved'
  UNION ALL
  SELECT b.project_id, i.resource_id, 0, i.quantity
  FROM nursery_outward_bills b
  JOIN nursery_outward_items i ON i.bill_id = b.id
) x
JOIN resources_materials rm ON rm.id = x.resource_id
WHERE rm.is_tree_species = true
GROUP BY x.project_id, rm.id, rm.name, rm.code;

GRANT SELECT ON nursery_stock TO authenticated;
GRANT SELECT ON nursery_stock TO anon;
