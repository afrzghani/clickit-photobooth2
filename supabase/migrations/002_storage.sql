-- ============================================================
-- Storage Bucket Policies
-- Jalankan setelah membuat bucket 'sessions' dan 'templates'
-- di Supabase Dashboard > Storage
-- ============================================================

-- Allow public read on sessions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sessions', 'sessions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Sessions bucket: anyone can upload (kiosk)
CREATE POLICY "sessions_anon_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'sessions');

-- Sessions bucket: public read
CREATE POLICY "sessions_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'sessions');

-- Templates bucket: authenticated upload only (admin)
CREATE POLICY "templates_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'templates');

-- Templates bucket: public read
CREATE POLICY "templates_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'templates');
