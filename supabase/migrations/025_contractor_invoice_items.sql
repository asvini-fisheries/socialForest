-- Line items linking contractor invoices to activity bills and expenses

CREATE TABLE contractor_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES contractor_invoices(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('activity_bill', 'expense')),
  stakeholder_bill_id UUID REFERENCES stakeholder_bills(id),
  contractor_expense_id UUID REFERENCES contractor_expenses(id),
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT contractor_invoice_items_source_check CHECK (
    (source_type = 'activity_bill' AND stakeholder_bill_id IS NOT NULL AND contractor_expense_id IS NULL)
    OR (source_type = 'expense' AND contractor_expense_id IS NOT NULL AND stakeholder_bill_id IS NULL)
  )
);

CREATE UNIQUE INDEX idx_contractor_invoice_items_bill
  ON contractor_invoice_items(stakeholder_bill_id)
  WHERE stakeholder_bill_id IS NOT NULL;

CREATE UNIQUE INDEX idx_contractor_invoice_items_expense
  ON contractor_invoice_items(contractor_expense_id)
  WHERE contractor_expense_id IS NOT NULL;

CREATE INDEX idx_contractor_invoice_items_invoice ON contractor_invoice_items(invoice_id);

ALTER TABLE contractor_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_contractor_invoice_items ON contractor_invoice_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY org_contractor_invoice_items ON contractor_invoice_items FOR ALL TO authenticated
  USING (
    get_user_role() = 'organisation'
    AND invoice_id IN (
      SELECT id FROM contractor_invoices WHERE project_id IN (SELECT get_user_project_ids())
    )
  ) WITH CHECK (
    get_user_role() = 'organisation'
    AND invoice_id IN (
      SELECT id FROM contractor_invoices WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

CREATE POLICY stakeholder_contractor_invoice_items ON contractor_invoice_items FOR SELECT TO authenticated
  USING (
    get_user_role() = 'stakeholder'
    AND invoice_id IN (
      SELECT id FROM contractor_invoices
      WHERE stakeholder_id = (SELECT stakeholder_id FROM users WHERE id = auth.uid())
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON contractor_invoice_items TO authenticated;
