-- Fix profile RLS policies to prevent loading issues
-- This ensures users can always read and create their own profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
-- IMPORTANT: No subquery to profiles table to avoid infinite recursion
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
-- IMPORTANT: No subquery to profiles table to avoid infinite recursion
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a helpful function to ensure profile exists after signup
-- This can be called by a trigger if needed
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

-- Create a trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

