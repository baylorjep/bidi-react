-- Add google_reviews_status column to business_profiles table
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS google_reviews_status VARCHAR(50) DEFAULT 'disconnected';

-- Add comment for the new column
COMMENT ON COLUMN business_profiles.google_reviews_status IS 'Status of Google reviews connection: disconnected, pending, connected, approved';

-- Update existing records to have the default value
UPDATE business_profiles 
SET google_reviews_status = 'disconnected' 
WHERE google_reviews_status IS NULL; 