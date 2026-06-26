-- Master Excel import audit logs
CREATE TABLE IF NOT EXISTS master_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_table TEXT NOT NULL,
  file_name TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  total_rows INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_import_logs_table ON master_import_logs(master_table);
CREATE INDEX IF NOT EXISTS idx_master_import_logs_created ON master_import_logs(created_at DESC);

ALTER TABLE master_import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage import logs" ON master_import_logs;
CREATE POLICY "Admins manage import logs" ON master_import_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Authenticated read import logs" ON master_import_logs;
CREATE POLICY "Authenticated read import logs" ON master_import_logs
  FOR SELECT USING (auth.role() = 'authenticated');
