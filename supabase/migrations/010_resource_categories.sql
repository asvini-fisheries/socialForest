-- Resource Category Master (material vs service)
CREATE TYPE resource_category_type AS ENUM ('material', 'service');

CREATE TABLE resource_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  category_type resource_category_type NOT NULL DEFAULT 'material',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resources_materials
  ADD COLUMN category_id UUID REFERENCES resource_categories(id);

-- Seed categories from existing resource data
INSERT INTO resource_categories (name, code, category_type) VALUES
  ('Tree Species', 'TREE-SPECIES', 'material'),
  ('Fertilizer', 'FERTILIZER', 'material'),
  ('Pesticide', 'PESTICIDE', 'material'),
  ('Equipment', 'EQUIPMENT', 'material'),
  ('Material', 'MATERIAL', 'material'),
  ('Tools', 'TOOLS', 'material'),
  ('Service', 'SERVICE', 'service')
ON CONFLICT (code) DO NOTHING;

UPDATE resources_materials rm
SET category_id = rc.id
FROM resource_categories rc
WHERE rm.category = rc.name;

UPDATE resources_materials rm
SET category_id = (SELECT id FROM resource_categories WHERE code = 'MATERIAL' LIMIT 1)
WHERE rm.category_id IS NULL;

ALTER TABLE resources_materials DROP COLUMN IF EXISTS category;

-- RLS
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_resource_categories ON resource_categories FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY admin_read_all_resource_categories ON resource_categories FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY read_resource_categories ON resource_categories FOR SELECT TO authenticated
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_resource_categories_updated_at
  BEFORE UPDATE ON resource_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
