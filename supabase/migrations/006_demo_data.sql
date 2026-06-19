-- Demo data for SocialForest initial testing

INSERT INTO csr_partners (name, code, contact_person, email, mobile, address, city, state, pincode)
SELECT 'Green Earth Foundation', 'GEF', 'Rajesh Kumar', 'csr@greenearth.org', '9876500001', '123 CSR Lane', 'Mumbai', 'Maharashtra', '400001'
WHERE NOT EXISTS (SELECT 1 FROM csr_partners WHERE code = 'GEF');

INSERT INTO organisations (name, code, address, city, state, pincode, gstin, pan)
SELECT 'Asvini Fisheries Pvt Ltd', 'ASVINI', '456 Industrial Area', 'Chennai', 'Tamil Nadu', '600001', '33AAAAA0000A1Z5', 'AAAAA0000A'
WHERE NOT EXISTS (SELECT 1 FROM organisations WHERE code = 'ASVINI');

INSERT INTO organisation_contacts (organisation_id, name, designation, email, mobile, is_primary)
SELECT o.id, 'Priya Sharma', 'Project Manager', 'priya@asvini.com', '9876500002', true
FROM organisations o
WHERE o.code = 'ASVINI'
  AND NOT EXISTS (
    SELECT 1 FROM organisation_contacts oc
    WHERE oc.organisation_id = o.id AND oc.mobile = '9876500002'
  );

INSERT INTO stakeholders (category_id, name, code, contact_person, mobile, email, gstin, pan)
SELECT sc.id, 'Forest Works Contractors', 'FWC', 'Suresh Patel', '9876500003', 'suresh@fwc.com', '33BBBBB0000B1Z5', 'BBBBB0000B'
FROM stakeholder_categories sc
WHERE sc.code = 'CON'
  AND NOT EXISTS (SELECT 1 FROM stakeholders WHERE code = 'FWC');

INSERT INTO projects (year_id, csr_partner_id, organisation_id, name, code, description, total_land_area_acres, total_trees_planned, budget_amount, status, start_date, location, district, state)
SELECT y.id, c.id, o.id,
  'Chennai Coastal Agroforestry 2025-26', 'CCAF-2526',
  'Coastal belt agroforestry with biodiversity conservation',
  150.00, 50000, 25000000.00, 'active', '2025-04-01',
  'East Coast Road, Chennai', 'Chennai', 'Tamil Nadu'
FROM years y, csr_partners c, organisations o
WHERE y.year_label = '2025-26' AND c.code = 'GEF' AND o.code = 'ASVINI'
  AND NOT EXISTS (SELECT 1 FROM projects WHERE code = 'CCAF-2526');

INSERT INTO project_areas (project_id, parent_area_id, level, name, code, land_area_acres, trees_planned)
SELECT p.id, NULL, 1, 'Zone A - North', 'ZA', 75.00, 25000
FROM projects p
WHERE p.code = 'CCAF-2526'
  AND NOT EXISTS (SELECT 1 FROM project_areas WHERE project_id = p.id AND code = 'ZA');

INSERT INTO project_areas (project_id, parent_area_id, level, name, code, land_area_acres, trees_planned)
SELECT p.id, pa.id, 2, 'Block A1', 'ZA-A1', 40.00, 13000
FROM projects p
JOIN project_areas pa ON pa.project_id = p.id AND pa.code = 'ZA'
WHERE p.code = 'CCAF-2526'
  AND NOT EXISTS (SELECT 1 FROM project_areas WHERE project_id = p.id AND code = 'ZA-A1');

INSERT INTO project_areas (project_id, parent_area_id, level, name, code, land_area_acres, trees_planned)
SELECT p.id, pa.id, 3, 'Plot A1-1', 'ZA-A1-P1', 15.00, 5000
FROM projects p
JOIN project_areas pa ON pa.project_id = p.id AND pa.code = 'ZA-A1'
WHERE p.code = 'CCAF-2526'
  AND NOT EXISTS (SELECT 1 FROM project_areas WHERE project_id = p.id AND code = 'ZA-A1-P1');

INSERT INTO stakeholder_resources (stakeholder_id, resource_id)
SELECT s.id, r.id
FROM stakeholders s
CROSS JOIN resources_materials r
WHERE s.code = 'FWC' AND r.code IN ('TEAK', 'NEEM', 'MANURE-ORG')
ON CONFLICT (stakeholder_id, resource_id) DO NOTHING;
