-- Nursery purchase-bill style inward/outward entries with line items

-- ============================================================
-- INWARD BILLS (header + items)
-- ============================================================

CREATE TABLE nursery_inward_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id),
  invoice_number VARCHAR(100) NOT NULL,
  bill_date DATE NOT NULL,
  image_url TEXT,
  remarks TEXT,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nursery_inward_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES nursery_inward_bills(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nursery_inward_bills_project ON nursery_inward_bills(project_id);
CREATE INDEX idx_nursery_inward_bills_date ON nursery_inward_bills(bill_date);
CREATE INDEX idx_nursery_inward_items_bill ON nursery_inward_items(bill_id);

-- ============================================================
-- OUTWARD ENTRIES (header + items)
-- ============================================================

CREATE TABLE nursery_outward_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_area_id UUID REFERENCES project_areas(id),
  issue_category nursery_issue_category NOT NULL DEFAULT 'plantation',
  log_number VARCHAR(100),
  issue_date DATE NOT NULL,
  image_url TEXT,
  remarks TEXT,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nursery_outward_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES nursery_outward_bills(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources_materials(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nursery_outward_bills_project ON nursery_outward_bills(project_id);
CREATE INDEX idx_nursery_outward_bills_date ON nursery_outward_bills(issue_date);
CREATE INDEX idx_nursery_outward_items_bill ON nursery_outward_items(bill_id);

-- Migrate legacy flat rows into bill + item structure
INSERT INTO nursery_inward_bills (
  id, project_id, stakeholder_id, invoice_number, bill_date, remarks, total_amount, recorded_by, created_at
)
SELECT
  id,
  project_id,
  stakeholder_id,
  COALESCE(NULLIF(TRIM(remarks), ''), 'LEGACY-' || LEFT(id::text, 8)),
  inward_date,
  remarks,
  0,
  recorded_by,
  created_at
FROM nursery_inwards;

INSERT INTO nursery_inward_items (bill_id, resource_id, quantity, unit_rate, amount)
SELECT id, resource_id, quantity, 0, 0
FROM nursery_inwards;

INSERT INTO nursery_outward_bills (
  id, project_id, project_area_id, issue_category, log_number, issue_date, remarks, recorded_by, created_at
)
SELECT
  id,
  project_id,
  project_area_id,
  issue_category,
  COALESCE(NULLIF(TRIM(remarks), ''), 'LEGACY-' || LEFT(id::text, 8)),
  issue_date,
  remarks,
  issued_by,
  created_at
FROM nursery_issues;

INSERT INTO nursery_outward_items (bill_id, resource_id, quantity, unit_rate, amount)
SELECT id, resource_id, quantity, 0, 0
FROM nursery_issues;

-- Project-scoped stock view (replaces global aggregation)
-- Must drop first: CREATE OR REPLACE cannot add/rename leading columns.
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

-- RLS
ALTER TABLE nursery_inward_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_inward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_outward_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_outward_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_nursery_inward_bills ON nursery_inward_bills FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_nursery_inward_bills ON nursery_inward_bills FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY stakeholder_nursery_inward_bills ON nursery_inward_bills FOR ALL TO authenticated
  USING (
    get_user_role() = 'stakeholder'
    AND stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
  ) WITH CHECK (
    get_user_role() = 'stakeholder'
    AND stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY nursery_inward_items_access ON nursery_inward_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nursery_inward_bills b
      WHERE b.id = bill_id
        AND (
          is_admin()
          OR (get_user_role() = 'organisation' AND b.project_id IN (SELECT get_user_project_ids()))
          OR (get_user_role() = 'stakeholder' AND b.stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid()))
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM nursery_inward_bills b
      WHERE b.id = bill_id
        AND (
          is_admin()
          OR (get_user_role() = 'organisation' AND b.project_id IN (SELECT get_user_project_ids()))
          OR (get_user_role() = 'stakeholder' AND b.stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid()))
        )
    )
  );

CREATE POLICY admin_all_nursery_outward_bills ON nursery_outward_bills FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_nursery_outward_bills ON nursery_outward_bills FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY nursery_outward_items_access ON nursery_outward_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nursery_outward_bills b
      WHERE b.id = bill_id
        AND (
          is_admin()
          OR (get_user_role() = 'organisation' AND b.project_id IN (SELECT get_user_project_ids()))
        )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM nursery_outward_bills b
      WHERE b.id = bill_id
        AND (
          is_admin()
          OR (get_user_role() = 'organisation' AND b.project_id IN (SELECT get_user_project_ids()))
        )
    )
  );

-- Storage for nursery bill images (reuse invoice-attachments bucket path nursery/)
-- Policies already allow authenticated upload to invoice-attachments

CREATE TRIGGER nursery_inward_bills_updated_at
  BEFORE UPDATE ON nursery_inward_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER nursery_outward_bills_updated_at
  BEFORE UPDATE ON nursery_outward_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
