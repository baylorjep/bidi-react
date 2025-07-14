-- Add missing category-specific columns to existing business_pricing_rules table

-- Photography-specific fields
ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS full_day_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS half_day_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS photo_editing_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS rush_editing_fee DECIMAL(10,2);

-- Florist-specific fields
ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS flower_tiers JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);

-- DJ-specific fields
ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS equipment_packages JSONB DEFAULT '{}';

-- Catering-specific fields
ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS menu_tiers JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_staff JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kitchen_rental DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS china_rental DECIMAL(10,2);

-- Videography-specific fields
ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS editing_rate DECIMAL(10,2);

-- Beauty-specific fields
ALTER TABLE business_pricing_rules 
ADD COLUMN IF NOT EXISTS hair_only_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS makeup_only_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS travel_fee DECIMAL(10,2);

-- Add comments for the new columns
COMMENT ON COLUMN business_pricing_rules.full_day_rate IS 'Full day photography rate';
COMMENT ON COLUMN business_pricing_rules.half_day_rate IS 'Half day photography rate';
COMMENT ON COLUMN business_pricing_rules.photo_editing_rate IS 'Rate per photo for editing';
COMMENT ON COLUMN business_pricing_rules.rush_editing_fee IS 'Fee for expedited photo editing';
COMMENT ON COLUMN business_pricing_rules.flower_tiers IS 'JSON object with flower tier multipliers (florist)';
COMMENT ON COLUMN business_pricing_rules.setup_fee IS 'Setup fee for florist services';
COMMENT ON COLUMN business_pricing_rules.delivery_fee IS 'Delivery fee for florist services';
COMMENT ON COLUMN business_pricing_rules.overtime_rate IS 'Overtime rate for DJ services';
COMMENT ON COLUMN business_pricing_rules.equipment_packages IS 'JSON object with equipment package pricing (dj)';
COMMENT ON COLUMN business_pricing_rules.menu_tiers IS 'JSON object with menu service multipliers (catering)';
COMMENT ON COLUMN business_pricing_rules.service_staff IS 'JSON object with service staff configuration (catering)';
COMMENT ON COLUMN business_pricing_rules.kitchen_rental IS 'Kitchen rental fee for catering';
COMMENT ON COLUMN business_pricing_rules.china_rental IS 'China rental fee per person for catering';
COMMENT ON COLUMN business_pricing_rules.editing_rate IS 'Video editing rate per hour';
COMMENT ON COLUMN business_pricing_rules.hair_only_rate IS 'Hair styling only rate';
COMMENT ON COLUMN business_pricing_rules.makeup_only_rate IS 'Makeup only rate';
COMMENT ON COLUMN business_pricing_rules.travel_fee IS 'Travel fee for beauty services'; 