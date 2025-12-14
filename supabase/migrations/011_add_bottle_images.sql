-- Add image_url column to bottle_submissions for storing bottle photos

ALTER TABLE bottle_submissions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create a storage bucket for bottle images (requires manual setup in Supabase dashboard or via SQL)
-- Run these commands in the Supabase SQL Editor to set up storage:

-- Create the storage bucket (if not exists via dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bottle-images', 'bottle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own bottle images
CREATE POLICY "Users can upload their own bottle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bottle-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view bottle images (public read)
CREATE POLICY "Anyone can view bottle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bottle-images');

-- Allow users to update their own bottle images
CREATE POLICY "Users can update their own bottle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bottle-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own bottle images
CREATE POLICY "Users can delete their own bottle images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bottle-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
