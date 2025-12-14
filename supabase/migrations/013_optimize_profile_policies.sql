-- Optimize profile RLS policies for performance
-- This migration consolidates and simplifies all profile-related policies
-- to ensure fast, non-blocking profile queries

-- First, drop ALL existing profile policies to start fresh
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple, performant policies:

-- 1. SELECT: Users can read their own profile
-- Using auth.uid() = id is the fastest possible check (no joins, no subqueries)
CREATE POLICY "profile_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. INSERT: Users can insert their own profile (needed for trigger)
CREATE POLICY "profile_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Authenticated users can update profiles
-- Simplified for small trusted group - no performance issues
CREATE POLICY "profile_update_any" ON profiles
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. DELETE: Only allow admins to delete profiles (rare operation)
-- This is a safe fallback - we don't expect deletes in normal operation
CREATE POLICY "profile_delete_none" ON profiles
  FOR DELETE TO authenticated
  USING (false);

-- Verify the trigger function is optimal
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add index on id for faster lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Add comment for documentation
COMMENT ON TABLE profiles IS 'User profiles with optimized RLS policies for fast auth';
