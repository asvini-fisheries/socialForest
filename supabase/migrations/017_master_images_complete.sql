-- Complete master image columns (safe to re-run)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE project_areas ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE project_activities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE project_user_access ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE years ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE designations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholders ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE resources_materials ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE resource_categories ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE stakeholder_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholder_resources ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholder_supply_rates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholder_category_access_rights ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE organisation_contacts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE organisation_certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE organisation_employees ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE activity_resource_requirements ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE activity_contractor_allocations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE work_contracts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE work_contract_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Storage bucket + policies (from 014; idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'master-images',
  'master-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read master images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read master images"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'master-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated upload master images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated upload master images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'master-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update master images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated update master images"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'master-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete master images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated delete master images"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'master-images');
  END IF;
END $$;
