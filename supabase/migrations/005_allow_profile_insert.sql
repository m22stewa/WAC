-- Add INSERT policy for profiles so users can create their own profile on signup

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
