-- Add waiting_list role to profiles and add waiting_list_order field

-- Update role enum to include waiting_list
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'admin', 'waiting_list'));

-- Add waiting_list_order column for sorting waiting list users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waiting_list_order INTEGER DEFAULT 0;

-- Create index for better sorting performance
CREATE INDEX IF NOT EXISTS idx_profiles_waiting_list_order ON profiles(waiting_list_order) 
  WHERE role = 'waiting_list';

-- Function to auto-add event memberships when bottles are assigned to calendar
CREATE OR REPLACE FUNCTION auto_add_event_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- If a bottle is assigned to a calendar day, ensure the user is a member of that event
  IF NEW.bottle_submission_id IS NOT NULL THEN
    INSERT INTO event_memberships (event_id, user_id)
    SELECT NEW.event_id, bs.user_id
    FROM bottle_submissions bs
    WHERE bs.id = NEW.bottle_submission_id
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-add memberships
DROP TRIGGER IF EXISTS trigger_auto_add_event_membership ON calendar_days;
CREATE TRIGGER trigger_auto_add_event_membership
  AFTER INSERT OR UPDATE OF bottle_submission_id ON calendar_days
  FOR EACH ROW
  WHEN (NEW.bottle_submission_id IS NOT NULL)
  EXECUTE FUNCTION auto_add_event_membership();
