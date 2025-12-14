-- Add settlements table to track who has settled up for each event
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  has_settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  settled_by UUID REFERENCES profiles(id), -- Admin who marked it as settled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_settlements_event ON settlements(event_id);
CREATE INDEX IF NOT EXISTS idx_settlements_user ON settlements(user_id);

-- Enable RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can view, authenticated users can manage
CREATE POLICY "All users can view settlements" ON settlements
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can manage settlements" ON settlements
  FOR ALL TO authenticated
  USING (true);
