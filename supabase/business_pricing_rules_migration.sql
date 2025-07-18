-- Create business_pricing_rules table with all category-specific fields
CREATE TABLE IF NOT EXISTS business_pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  
  -- Basic pricing fields
  pricing_model TEXT DEFAULT 'fixed',
  hourly_rate DECIMAL(10,2),
  base_price DECIMAL(10,2),
  per_person_rate DECIMAL(10,2),
  travel_fee_per_mile DECIMAL(10,2),
  bid_aggressiveness TEXT DEFAULT 'balanced',
  accept_unknowns BOOLEAN DEFAULT true,
  blocklist_keywords TEXT[] DEFAULT '{}',
  default_message TEXT,
  additional_comments TEXT,
  pricing_packages JSONB DEFAULT '[]',
  
  -- Universal category fields
  wedding_premium DECIMAL(5,2),
  duration_multipliers JSONB DEFAULT '{}',
  service_addons JSONB DEFAULT '{}',
  seasonal_pricing JSONB DEFAULT '{}',
  rush_fee_percentage DECIMAL(5,2),
  deposit_percentage DECIMAL(5,2),
  minimum_guests INTEGER,
  maximum_guests INTEGER,
  group_discounts JSONB DEFAULT '{}',
  package_discounts JSONB DEFAULT '{}',
  custom_pricing_rules JSONB DEFAULT '[]',
  
  -- Photography-specific fields
  full_day_rate DECIMAL(10,2),
  half_day_rate DECIMAL(10,2),
  photo_editing_rate DECIMAL(10,2),
  rush_editing_fee DECIMAL(10,2),
  
  -- Florist-specific fields
  flower_tiers JSONB DEFAULT '{}',
  setup_fee DECIMAL(10,2),
  delivery_fee DECIMAL(10,2),
  
  -- DJ-specific fields
  overtime_rate DECIMAL(10,2),
  equipment_packages JSONB DEFAULT '{}',
  
  -- Catering-specific fields
  menu_tiers JSONB DEFAULT '{}',
  service_staff JSONB DEFAULT '{}',
  kitchen_rental DECIMAL(10,2),
  china_rental DECIMAL(10,2),
  
  -- Videography-specific fields
  editing_rate DECIMAL(10,2),
  
  -- Beauty-specific fields
  hair_only_rate DECIMAL(10,2),
  makeup_only_rate DECIMAL(10,2),
  travel_fee DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on business_id and category
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_pricing_rules_unique 
ON business_pricing_rules(business_id, category);

-- Enable RLS
ALTER TABLE business_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Businesses can manage their own pricing rules" ON business_pricing_rules;
DROP POLICY IF EXISTS "Businesses can view their own pricing rules" ON business_pricing_rules;
DROP POLICY IF EXISTS "Businesses can insert their own pricing rules" ON business_pricing_rules;
DROP POLICY IF EXISTS "Businesses can update their own pricing rules" ON business_pricing_rules;
DROP POLICY IF EXISTS "Businesses can delete their own pricing rules" ON business_pricing_rules;

-- Create policies
CREATE POLICY "Businesses can view their own pricing rules" ON business_pricing_rules
FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Businesses can insert their own pricing rules" ON business_pricing_rules
FOR INSERT WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can update their own pricing rules" ON business_pricing_rules
FOR UPDATE USING (business_id = auth.uid());

CREATE POLICY "Businesses can delete their own pricing rules" ON business_pricing_rules
FOR DELETE USING (business_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_pricing_rules_updated_at 
    BEFORE UPDATE ON business_pricing_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE business_pricing_rules IS 'Stores category-specific pricing rules for businesses to train Bidi AI';
COMMENT ON COLUMN business_pricing_rules.category IS 'The business category (photography, florist, dj, catering, videography, beauty)';
COMMENT ON COLUMN business_pricing_rules.pricing_model IS 'The primary pricing model (fixed, hourly, per_person, package)';
COMMENT ON COLUMN business_pricing_rules.seasonal_pricing IS 'JSON object with seasonal multipliers (florist)';
COMMENT ON COLUMN business_pricing_rules.flower_tiers IS 'JSON object with flower tier multipliers (florist)';
COMMENT ON COLUMN business_pricing_rules.equipment_packages IS 'JSON object with equipment package pricing (dj)';
COMMENT ON COLUMN business_pricing_rules.menu_tiers IS 'JSON object with menu service multipliers (catering)';
COMMENT ON COLUMN business_pricing_rules.service_staff IS 'JSON object with service staff configuration (catering)';
COMMENT ON COLUMN business_pricing_rules.pricing_packages IS 'JSON array of custom pricing packages'; 