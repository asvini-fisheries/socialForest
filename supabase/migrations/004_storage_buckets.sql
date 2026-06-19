-- Storage buckets for SocialForest file uploads

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('activity-images', 'activity-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('census-images', 'census-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('invoice-attachments', 'invoice-attachments', false, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('receipt-attachments', 'receipt-attachments', false, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('expense-attachments', 'expense-attachments', false, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('employee-reports', 'employee-reports', false, 20971520, ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('org-logos', 'org-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
  ('certificates', 'certificates', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to their project buckets
CREATE POLICY "Authenticated users can upload activity images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'activity-images');

CREATE POLICY "Authenticated users can view activity images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'activity-images');

CREATE POLICY "Authenticated users can upload census images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'census-images');

CREATE POLICY "Authenticated users can view census images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'census-images');

CREATE POLICY "Authenticated users can upload invoice attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoice-attachments');

CREATE POLICY "Authenticated users can view invoice attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'invoice-attachments');

CREATE POLICY "Authenticated users can upload receipt attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipt-attachments');

CREATE POLICY "Authenticated users can view receipt attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipt-attachments');

CREATE POLICY "Authenticated users can upload expense attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-attachments');

CREATE POLICY "Authenticated users can view expense attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'expense-attachments');

CREATE POLICY "Authenticated users can upload employee reports"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-reports');

CREATE POLICY "Authenticated users can view employee reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-reports');

CREATE POLICY "Anyone can view org logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can upload org logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can upload certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can view certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates');
