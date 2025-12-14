-- URGENT FIX: Run this immediately in Supabase SQL Editor
-- This removes the infinite recursion in RLS policies

-- Drop ALL existing profile policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create simple, non-recursive policies
-- All authenticated users can view all profiles
CREATE POLICY "All users can view profiles" ON profiles
  FOR SELECT TO authenticated 
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile (no admin check to avoid recursion)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add trigger to auto-create profiles
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix other tables that check profiles table in their policies
-- BOTTLE SUBMISSIONS
DROP POLICY IF EXISTS "Users can update own bottle submission" ON bottle_submissions;
DROP POLICY IF EXISTS "Admins can delete bottle submissions" ON bottle_submissions;

CREATE POLICY "Users can update own bottle submission" ON bottle_submissions
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- EVENTS
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- For now, allow all authenticated users to manage events
-- You can add admin-only logic in your application code
CREATE POLICY "Authenticated users can insert events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events" ON events
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete events" ON events
  FOR DELETE TO authenticated
  USING (true);

-- EVENT MEMBERSHIPS
DROP POLICY IF EXISTS "Admins can manage memberships" ON event_memberships;

CREATE POLICY "Authenticated users can manage memberships" ON event_memberships
  FOR ALL TO authenticated
  USING (true);

-- CALENDAR DAYS
DROP POLICY IF EXISTS "Admins can manage calendar days" ON calendar_days;

CREATE POLICY "Authenticated users can manage calendar days" ON calendar_days
  FOR ALL TO authenticated
  USING (true);

-- ANNOUNCEMENTS  
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

CREATE POLICY "Authenticated users can manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (true);
