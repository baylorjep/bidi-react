-- Comprehensive migration to fix missing columns causing 400 errors

-- Fix user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

-- Fix business_profiles table (if any missing columns)
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS google_reviews_status VARCHAR(50) DEFAULT 'disconnected',
ADD COLUMN IF NOT EXISTS google_business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_business_address TEXT,
ADD COLUMN IF NOT EXISTS google_business_account_id VARCHAR(255);

-- Fix individual_profiles table (if any missing columns)
ALTER TABLE individual_profiles 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

-- Fix requests table (if any missing columns)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

-- Fix category-specific request tables
ALTER TABLE photography_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

ALTER TABLE videography_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

ALTER TABLE dj_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

ALTER TABLE beauty_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

ALTER TABLE florist_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

ALTER TABLE catering_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

ALTER TABLE wedding_planning_requests 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

-- Fix partners table (if any missing columns)
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS has_seen JSONB DEFAULT '{}';

-- Add comments for the new columns
COMMENT ON COLUMN user_preferences.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN individual_profiles.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN photography_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN videography_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN dj_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN beauty_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN florist_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN catering_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN wedding_planning_requests.has_seen IS 'JSON object tracking what the user has seen';
COMMENT ON COLUMN partners.has_seen IS 'JSON object tracking what the user has seen';

-- Update existing records to have the default value
UPDATE user_preferences SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE individual_profiles SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE photography_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE videography_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE dj_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE beauty_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE florist_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE catering_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE wedding_planning_requests SET has_seen = '{}' WHERE has_seen IS NULL;
UPDATE partners SET has_seen = '{}' WHERE has_seen IS NULL; 