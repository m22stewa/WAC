# Profile Loading Issue - URGENT FIX

## 🚨 CRITICAL ERROR: Infinite Recursion in RLS Policies

**Error Message:** `infinite recursion detected in policy for relation "profiles"`

## Problem Summary
Your RLS policies are checking the profiles table WHILE reading from the profiles table, creating infinite recursion. This happens when a policy like this exists:

```sql
-- BAD - CAUSES INFINITE RECURSION
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    -- ^^^ This queries profiles while in a profiles policy = RECURSION!
  );
```

## IMMEDIATE FIX - Run This Now!

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Copy and Run the Fix
Copy the **entire contents** of the file `URGENT_FIX.sql` and run it in the SQL Editor.

This will:
- ✅ Remove all policies with infinite recursion
- ✅ Create simple, working policies
- ✅ Add automatic profile creation trigger
- ✅ Allow your app to work immediately

### Step 3: Reload Your App
After running the SQL:
1. Close all browser tabs with your app
2. Clear browser cache (Ctrl+Shift+Delete) or hard refresh (Ctrl+F5)
3. Open your app and try logging in

## What the Fix Does

### Profiles Table
- **SELECT**: All authenticated users can view all profiles
- **INSERT**: Users can create their own profile
- **UPDATE**: Users can update only their own profile
- **Trigger**: Automatically creates profile when user signs up

### Other Tables
- Temporarily allows all authenticated users to manage data
- You can add admin-only restrictions in your application code

## After the Fix

Your console should show:
- ✅ "Found existing profile"
- ✅ "Successfully created new profile"

You should NOT see:
- ❌ "infinite recursion detected"
- ❌ "Profile Loading Error"

### Step 2: (Optional) Fix Existing Users Without Profiles

Run this query in Supabase SQL Editor to create profiles for any users that don't have them:

```sql
INSERT INTO public.profiles (id, name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.email,
  'user'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);
```

### Step 3: Test the Fix
1. Have existing users try logging in again
2. Try creating a new test user
3. Monitor the browser console for any remaining errors

## What Changed

### Before:
- Profile fetch could timeout in 1 second
- RLS policy required checking profiles table while reading profiles (chicken-and-egg problem)
- If fetch failed, entire auth flow failed
- No automatic profile creation

### After:
- Profile fetch has 5 seconds to complete
- RLS policy allows users to directly read their own profile (auth.uid() = id)
- Database trigger automatically creates profiles
- Fetch failures don't stop profile creation
- Better error messages in console

## Rollback Plan
If you need to rollback, run:

```sql
-- Revert to simplified policies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Then re-run migration 002_simplified_rls.sql
```

## Monitoring
After applying the fix, check browser console logs for:
- ✅ "Found existing profile" - Good
- ✅ "Successfully created new profile" - Good
- ⏱️ "Profile fetch timed out" - Shouldn't see this anymore
- ❌ "Error fetching profile" - Investigate if this persists
