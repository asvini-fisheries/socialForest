-- Master image attachments: image_url column + storage bucket

ALTER TABLE years ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE designations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stakeholders ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE resources_materials ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE resource_categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- csr_partners.logo_url, organisations.logo_url, users.avatar_url already exist

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'master-images',
  'master-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read master images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'master-images');

CREATE POLICY "Authenticated upload master images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'master-images');

CREATE POLICY "Authenticated update master images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'master-images');

CREATE POLICY "Authenticated delete master images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'master-images');
