-- Add autobidding fields to business_pricing_rules table
-- This migration adds the core autobidding configuration fields

ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS base_category_rates JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seasonal_pricing JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS travel_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS platform_markup DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS consultation_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dealbreakers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS style_preferences TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN business_pricing_rules.base_category_rates IS 'JSON object storing base rates for different service categories (e.g., wedding, family, couples)';
COMMENT ON COLUMN business_pricing_rules.seasonal_pricing IS 'JSON object storing seasonal pricing multipliers (e.g., summer, winter)';
COMMENT ON COLUMN business_pricing_rules.travel_config IS 'JSON object storing travel-related configuration (e.g., driving rate, free distance)';
COMMENT ON COLUMN business_pricing_rules.platform_markup IS 'Percentage markup to cover platform fees';
COMMENT ON COLUMN business_pricing_rules.consultation_required IS 'Whether consultation call is required before final quote';
COMMENT ON COLUMN business_pricing_rules.dealbreakers IS 'Array of dealbreaker keywords or conditions';
COMMENT ON COLUMN business_pricing_rules.style_preferences IS 'Array of style preferences (e.g., music genres for DJs)'; 