-- Add image_url column to room_types table
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for room type images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload room images
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'room-images');

-- Allow authenticated users to update room images
CREATE POLICY "Authenticated users can update room images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'room-images');

-- Allow authenticated users to delete room images
CREATE POLICY "Authenticated users can delete room images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'room-images');

-- Allow public read access to room images
CREATE POLICY "Public can view room images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'room-images');
