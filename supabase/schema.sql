-- Create the wedding_planning_photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding_planning_photos',
  'wedding_planning_photos',
  true,
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on wedding_mood_board table
ALTER TABLE wedding_mood_board ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own mood board images" ON wedding_mood_board;
DROP POLICY IF EXISTS "Users can view their own mood board images" ON wedding_mood_board;
DROP POLICY IF EXISTS "Users can update their own mood board images" ON wedding_mood_board;
DROP POLICY IF EXISTS "Users can delete their own mood board images" ON wedding_mood_board;

-- Policy to allow users to insert their own mood board images
CREATE POLICY "Users can insert their own mood board images" ON wedding_mood_board
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM wedding_plans 
    WHERE id = wedding_plan_id 
    AND user_id = auth.uid()
  )
);

-- Policy to allow users to select their own mood board images
CREATE POLICY "Users can view their own mood board images" ON wedding_mood_board
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM wedding_plans 
    WHERE id = wedding_plan_id 
    AND user_id = auth.uid()
  )
);

-- Policy to allow users to update their own mood board images
CREATE POLICY "Users can update their own mood board images" ON wedding_mood_board
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM wedding_plans 
    WHERE id = wedding_plan_id 
    AND user_id = auth.uid()
  )
);

-- Policy to allow users to delete their own mood board images
CREATE POLICY "Users can delete their own mood board images" ON wedding_mood_board
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM wedding_plans 
    WHERE id = wedding_plan_id 
    AND user_id = auth.uid()
  )
);

-- Storage bucket policies for wedding_planning_photos
-- Enable RLS on the storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to their own wedding planning photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own wedding planning photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wedding planning photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wedding planning photos" ON storage.objects;

-- Policy to allow users to upload files to their own folder
CREATE POLICY "Users can upload to their own wedding planning photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wedding_planning_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to view their own files
CREATE POLICY "Users can view their own wedding planning photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'wedding_planning_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to update their own files
CREATE POLICY "Users can update their own wedding planning photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'wedding_planning_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete their own wedding planning photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'wedding_planning_photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
