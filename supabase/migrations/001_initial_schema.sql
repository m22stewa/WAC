-- Whiskey Advent Calendar - Initial Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events (yearly calendars)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT '2024-12-01',
  end_date DATE NOT NULL DEFAULT '2024-12-24',
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event memberships
CREATE TABLE IF NOT EXISTS event_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_override TEXT CHECK (role_override IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Bottle submissions
CREATE TABLE IF NOT EXISTS bottle_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  whiskey_name TEXT NOT NULL,
  distillery TEXT,
  country TEXT,
  style TEXT,
  abv DECIMAL(5,2),
  volume TEXT,
  price DECIMAL(10,2),
  purchase_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Calendar days
CREATE TABLE IF NOT EXISTS calendar_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 24),
  bottle_submission_id UUID REFERENCES bottle_submissions(id) ON DELETE SET NULL,
  reveal_date DATE,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, day_number)
);

-- Tasting entries
CREATE TABLE IF NOT EXISTS tasting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_day_id UUID REFERENCES calendar_days(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  tasting_notes TEXT,
  would_buy_again BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calendar_day_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_day_id UUID REFERENCES calendar_days(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_memberships_user ON event_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_event_memberships_event ON event_memberships(event_id);
CREATE INDEX IF NOT EXISTS idx_bottle_submissions_event ON bottle_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_days_event ON calendar_days(event_id);
CREATE INDEX IF NOT EXISTS idx_tasting_entries_day ON tasting_entries(calendar_day_id);
CREATE INDEX IF NOT EXISTS idx_comments_day ON comments(calendar_day_id);
CREATE INDEX IF NOT EXISTS idx_announcements_event ON announcements(event_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Events: Only members can view, only admins can modify
CREATE POLICY "Event members can view events" ON events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_memberships 
      WHERE event_memberships.event_id = events.id 
      AND event_memberships.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Event memberships: Members can view, admins can modify
CREATE POLICY "Members can view memberships" ON event_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage memberships" ON event_memberships
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Bottle submissions: Members can view, users manage their own
CREATE POLICY "Members can view bottle submissions" ON bottle_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_memberships 
      WHERE event_memberships.event_id = bottle_submissions.event_id 
      AND event_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own bottle submission" ON bottle_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bottle submission" ON bottle_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Calendar days: Members can view
CREATE POLICY "Members can view calendar days" ON calendar_days
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_memberships 
      WHERE event_memberships.event_id = calendar_days.event_id 
      AND event_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage calendar days" ON calendar_days
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Tasting entries: Members can view, users manage their own
CREATE POLICY "Members can view tasting entries" ON tasting_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_days cd
      JOIN event_memberships em ON em.event_id = cd.event_id
      WHERE cd.id = tasting_entries.calendar_day_id
      AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own tasting entries" ON tasting_entries
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Comments: Members can view, users manage their own
CREATE POLICY "Members can view comments" ON comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_days cd
      JOIN event_memberships em ON em.event_id = cd.event_id
      WHERE cd.id = comments.calendar_day_id
      AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Announcements: Members can view, admins can manage
CREATE POLICY "Members can view announcements" ON announcements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_memberships 
      WHERE event_memberships.event_id = announcements.event_id 
      AND event_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
