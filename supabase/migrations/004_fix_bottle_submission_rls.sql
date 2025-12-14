-- Update RLS policies for bottle_submissions to allow admins to create bottles without a user_id

-- Drop the old insert policy
DROP POLICY IF EXISTS "Users can insert own bottle submission" ON bottle_submissions;

-- Create new insert policy that allows:
-- 1. Users to insert their own bottles (user_id = auth.uid())
-- 2. Admins to insert bottles for anyone or without a user (user_id can be null or any user)
CREATE POLICY "Users can insert own bottle submission" ON bottle_submissions
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = auth.uid() 
    OR user_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Also update the delete policy to allow admins to insert
DROP POLICY IF EXISTS "Admins can delete bottle submissions" ON bottle_submissions;

CREATE POLICY "Admins can manage bottle submissions" ON bottle_submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
