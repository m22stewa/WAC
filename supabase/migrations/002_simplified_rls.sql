-- Whiskey Advent Calendar - Simplified RLS Policies
-- Run this AFTER running the initial schema if you're having permission issues
-- This version is designed for small private groups where all authenticated users can view everything

-- First, drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Event members can view events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "All users can view events" ON events;
DROP POLICY IF EXISTS "Members can view memberships" ON event_memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON event_memberships;
DROP POLICY IF EXISTS "Members can view bottle submissions" ON bottle_submissions;
DROP POLICY IF EXISTS "Users can insert own bottle submission" ON bottle_submissions;
DROP POLICY IF EXISTS "Users can update own bottle submission" ON bottle_submissions;
DROP POLICY IF EXISTS "Admins can manage bottle submissions" ON bottle_submissions;
DROP POLICY IF EXISTS "Members can view calendar days" ON calendar_days;
DROP POLICY IF EXISTS "Admins can manage calendar days" ON calendar_days;
DROP POLICY IF EXISTS "All users can view calendar days" ON calendar_days;
DROP POLICY IF EXISTS "Members can view tasting entries" ON tasting_entries;
DROP POLICY IF EXISTS "Users can manage own tasting entries" ON tasting_entries;
DROP POLICY IF EXISTS "All users can view tasting entries" ON tasting_entries;
DROP POLICY IF EXISTS "Members can view comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "All users can view comments" ON comments;
DROP POLICY IF EXISTS "Members can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "All users can view announcements" ON announcements;

-- ============================================
-- SIMPLIFIED POLICIES FOR SMALL PRIVATE GROUPS
-- ============================================

-- PROFILES: Everyone can view, users update their own, admins can update roles
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- EVENTS: All authenticated users can view, admins can manage
CREATE POLICY "All users can view events" ON events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- EVENT MEMBERSHIPS: All can view, admins can manage
CREATE POLICY "All users can view memberships" ON event_memberships
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage memberships" ON event_memberships
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- BOTTLE SUBMISSIONS: All can view, users manage their own, admins can manage all
CREATE POLICY "All users can view bottle submissions" ON bottle_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own bottle submission" ON bottle_submissions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bottle submission" ON bottle_submissions
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete bottle submissions" ON bottle_submissions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- CALENDAR DAYS: All can view, admins can manage
CREATE POLICY "All users can view calendar days" ON calendar_days
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage calendar days" ON calendar_days
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- TASTING ENTRIES: All can view, users manage their own
CREATE POLICY "All users can view tasting entries" ON tasting_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own tasting entries" ON tasting_entries
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- COMMENTS: All can view, users manage their own
CREATE POLICY "All users can view comments" ON comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ANNOUNCEMENTS: All can view, admins can manage
CREATE POLICY "All users can view announcements" ON announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
