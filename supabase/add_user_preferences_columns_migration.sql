-- Add missing columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

-- Add comment for the new column
COMMENT ON COLUMN user_preferences.has_seen IS 'JSON object tracking what the user has seen';

-- Update existing records to have the default value
UPDATE user_preferences 
SET has_seen = '{}' 
WHERE has_seen IS NULL; 