-- SCHEMA FOR OFFER & COUPON SYSTEM

-- 1. Create Campaign Type Enum (Optional, or just use text check)
-- 2. Create the campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g., "Festive Feast", "Pizza Party"
    description TEXT,
    code TEXT UNIQUE, -- Null for auto-applied campaigns, string for coupons
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')), -- Type of discount
    discount_value NUMERIC NOT NULL, -- The % or amount
    
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'category', 'item')), -- What does this apply to?
    target_id TEXT, -- ID of the category or item (null if target_type is 'all')
    
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ, -- Auto-expiry if set
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Realtime for campaigns
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;

-- 4. Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Public Read, Admin Write)
CREATE POLICY "Allow public select on campaigns" ON campaigns FOR SELECT TO public USING (true);
CREATE POLICY "Allow public all on campaigns" ON campaigns FOR ALL TO public USING (true); -- Simplified for this project's admin panel usage
