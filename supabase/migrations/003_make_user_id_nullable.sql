-- Make user_id nullable in bottle_submissions to allow bottles without assigned users
-- Drop the unique constraint first
ALTER TABLE bottle_submissions DROP CONSTRAINT IF EXISTS bottle_submissions_event_id_user_id_key;

-- Make user_id nullable
ALTER TABLE bottle_submissions ALTER COLUMN user_id DROP NOT NULL;

-- Add a new unique constraint that only applies when user_id is not null
-- This allows multiple bottles per event when user_id is null, but still prevents
-- duplicate user submissions for the same event when user_id is set
CREATE UNIQUE INDEX bottle_submissions_event_user_unique 
ON bottle_submissions (event_id, user_id) 
WHERE user_id IS NOT NULL;
