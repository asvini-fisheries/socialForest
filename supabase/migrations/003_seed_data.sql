-- Seed Data for SocialForest Master Tables

-- Years
INSERT INTO years (year_label, start_date, end_date, is_active) VALUES
  ('2024-25', '2024-04-01', '2025-03-31', true),
  ('2025-26', '2025-04-01', '2026-03-31', true),
  ('2026-27', '2026-04-01', '2027-03-31', true);

-- Designations
INSERT INTO designations (name, description) VALUES
  ('Project Manager', 'Overall project management'),
  ('Field Supervisor', 'On-ground field supervision'),
  ('Nursery Manager', 'Centralized nursery management'),
  ('Accounts Officer', 'Financial and billing management'),
  ('HR Manager', 'Human resources and statutory compliance'),
  ('Field Worker', 'Ground level execution'),
  ('Contractor', 'External contractor'),
  ('CSR Coordinator', 'CSR partner liaison');

-- Certificates
INSERT INTO certificates (name, description, validity_period_months) VALUES
  ('ISO 14001', 'Environmental Management System', 36),
  ('FSC Certification', 'Forest Stewardship Council', 60),
  ('Organic Certification', 'Organic farming practices', 12),
  ('GST Registration', 'Goods and Services Tax', NULL),
  ('PAN Card', 'Permanent Account Number', NULL),
  ('ESIC Registration', 'Employee State Insurance', NULL),
  ('PF Registration', 'Provident Fund', NULL);

-- Stakeholder Categories
INSERT INTO stakeholder_categories (name, code, description) VALUES
  ('Contractor', 'CON', 'Main execution contractors'),
  ('Sub-Contractor', 'SUB', 'Sub-contracted work units'),
  ('Material Supplier', 'SUP', 'Resource and material suppliers'),
  ('Nursery Operator', 'NUR', 'Tree nursery operators'),
  ('Equipment Provider', 'EQP', 'Tools and equipment providers'),
  ('Transport Provider', 'TRN', 'Logistics and transport');

-- Stakeholder Category Access Rights
INSERT INTO stakeholder_category_access_rights (category_id, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT sc.id, m.module_name, m.can_view, m.can_create, m.can_edit, m.can_delete, m.can_approve
FROM stakeholder_categories sc
CROSS JOIN (VALUES
  ('daily_activities', true, true, true, false, false),
  ('bills', true, true, true, false, false),
  ('invoices', true, true, true, false, false),
  ('expenses', true, true, true, false, false),
  ('tools_stock', true, true, true, false, false),
  ('nursery_inwards', true, true, false, false, false),
  ('employee_reports', true, true, false, false, false)
) AS m(module_name, can_view, can_create, can_edit, can_delete, can_approve)
WHERE sc.code = 'CON';

-- Activities Master
INSERT INTO activities (name, code, description, unit_of_measurement) VALUES
  ('Land Preparation', 'LAND-PREP', 'Clearing and preparing land for plantation', 'acres'),
  ('Pit Digging', 'PIT-DIG', 'Digging pits for tree plantation', 'pits'),
  ('Tree Plantation', 'TREE-PLANT', 'Planting saplings in prepared pits', 'trees'),
  ('Irrigation', 'IRRIG', 'Watering and irrigation activities', 'hours'),
  ('Weeding', 'WEED', 'Weed removal and maintenance', 'acres'),
  ('Fencing', 'FENCE', 'Installing protective fencing', 'meters'),
  ('Manuring', 'MANURE', 'Application of organic manure', 'kg'),
  ('Pest Control', 'PEST', 'Pest and disease control measures', 'acres'),
  ('Tree Replacement', 'TREE-REPL', 'Replacing dead or diseased trees', 'trees'),
  ('Census Survey', 'CENSUS', 'Tree health census and monitoring', 'trees'),
  ('Fire Line Creation', 'FIRE-LINE', 'Creating fire break lines', 'meters'),
  ('Pathway Creation', 'PATH', 'Creating access pathways', 'meters');

-- Resources/Materials Master
INSERT INTO resources_materials (name, code, description, unit_of_measurement, category, is_tree_species) VALUES
  ('Teak Sapling', 'TEAK', 'Tectona grandis sapling', 'nos', 'Tree Species', true),
  ('Neem Sapling', 'NEEM', 'Azadirachta indica sapling', 'nos', 'Tree Species', true),
  ('Bamboo Sapling', 'BAMBOO', 'Bambusa bambos sapling', 'nos', 'Tree Species', true),
  ('Mango Sapling', 'MANGO', 'Mangifera indica sapling', 'nos', 'Tree Species', true),
  ('Jamun Sapling', 'JAMUN', 'Syzygium cumini sapling', 'nos', 'Tree Species', true),
  ('Organic Manure', 'MANURE-ORG', 'Farm yard manure', 'kg', 'Fertilizer', false),
  ('Vermicompost', 'VERMI', 'Vermicompost fertilizer', 'kg', 'Fertilizer', false),
  ('Bio Pesticide', 'BIO-PEST', 'Organic pest control solution', 'liters', 'Pesticide', false),
  ('Drip Irrigation Kit', 'DRIP-KIT', 'Drip irrigation system components', 'sets', 'Equipment', false),
  ('Fencing Wire', 'FENCE-WIRE', 'Barbed wire for fencing', 'meters', 'Material', false),
  ('Fencing Posts', 'FENCE-POST', 'Wooden/cement fencing posts', 'nos', 'Material', false),
  ('Digging Tools Set', 'DIG-TOOLS', 'Spade, pickaxe, hoe set', 'sets', 'Tools', false),
  ('Water Tanker', 'WATER-TANK', 'Water tanker for irrigation', 'trips', 'Service', false);
