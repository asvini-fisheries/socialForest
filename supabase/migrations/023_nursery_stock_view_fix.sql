-- Fix nursery_stock view when 021 failed at CREATE OR REPLACE VIEW
-- (old view had resource_id first; new view adds project_id as first column)

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
