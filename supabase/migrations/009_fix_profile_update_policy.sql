-- Fix RLS policies to allow role updates
-- This complements URGENT_FIX.sql and allows admins to manage user roles

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow all authenticated users to update profiles (simplified for small trusted groups)
-- This lets admins change user roles without complex admin checks
CREATE POLICY "Authenticated users can update profiles" ON profiles
  FOR UPDATE TO authenticated 
  USING (true)
  WITH CHECK (true);
