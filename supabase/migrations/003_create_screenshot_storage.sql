-- Create storage bucket for kiosk screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kiosk-screenshots',
  'kiosk-screenshots',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kiosk-screenshots');

-- Allow authenticated users to update screenshots
CREATE POLICY "Authenticated users can update screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'kiosk-screenshots');

-- Allow public read access to screenshots
CREATE POLICY "Public can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kiosk-screenshots');
