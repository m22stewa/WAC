-- Fix auto_add_event_membership to skip inserting event membership when bottle has no user

CREATE OR REPLACE FUNCTION auto_add_event_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- If a bottle is assigned to a calendar day and the bottle has a user, ensure the user is a member of that event
  IF NEW.bottle_submission_id IS NOT NULL THEN
    INSERT INTO event_memberships (event_id, user_id)
    SELECT NEW.event_id, bs.user_id
    FROM bottle_submissions bs
    WHERE bs.id = NEW.bottle_submission_id
      AND bs.user_id IS NOT NULL
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure it uses the updated function (safe to DROP/CREATE)
DROP TRIGGER IF EXISTS trigger_auto_add_event_membership ON calendar_days;
CREATE TRIGGER trigger_auto_add_event_membership
  AFTER INSERT OR UPDATE OF bottle_submission_id ON calendar_days
  FOR EACH ROW
  WHEN (NEW.bottle_submission_id IS NOT NULL)
  EXECUTE FUNCTION auto_add_event_membership();
