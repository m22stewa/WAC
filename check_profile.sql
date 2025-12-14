-- Check if profile exists for your user
-- Run this in Supabase SQL Editor to verify

-- 1. Check if profile exists for user ID: 4719952f-efc6-4d96-9e12-dd98653122c0
SELECT * FROM profiles WHERE id = '4719952f-efc6-4d96-9e12-dd98653122c0';

-- 2. If profile doesn't exist, create it manually
INSERT INTO profiles (id, name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.email,
  'user'
FROM auth.users au
WHERE au.id = '4719952f-efc6-4d96-9e12-dd98653122c0'
ON CONFLICT (id) DO NOTHING;

-- 3. Check all profiles
SELECT id, name, email, role, created_at FROM profiles ORDER BY created_at DESC;

-- 4. Check all auth users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- 5. Find users without profiles
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
