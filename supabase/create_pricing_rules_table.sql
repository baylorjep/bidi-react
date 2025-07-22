-- Create a simplified business_pricing_rules table with essential fields
CREATE TABLE IF NOT EXISTS business_pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  
  -- Essential pricing fields
  pricing_model TEXT DEFAULT 'fixed',
  hourly_rate DECIMAL(10,2),
  base_price DECIMAL(10,2),
  per_person_rate DECIMAL(10,2),
  travel_fee_per_mile DECIMAL(10,2),
  bid_aggressiveness TEXT DEFAULT 'balanced',
  blocklist_keywords TEXT[] DEFAULT '{}',
  default_message TEXT,
  additional_comments TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on business_id and category
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_pricing_rules_unique 
ON business_pricing_rules(business_id, category);

-- Enable RLS
ALTER TABLE business_pricing_rules ENABLE ROW LEVEL SECURITY;

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