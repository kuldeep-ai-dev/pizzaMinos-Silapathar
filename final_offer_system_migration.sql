-- FINAL MIGRATION FOR OFFER & COUPON SYSTEM
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE, -- Null for auto-applied campaigns, string for coupons
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'category', 'item')),
    target_id TEXT, -- ID of the category or item
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update orders table to support discounts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_amount') THEN
        ALTER TABLE orders ADD COLUMN discount_amount NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='coupon_code') THEN
        ALTER TABLE orders ADD COLUMN coupon_code TEXT;
    END IF;
END $$;

-- 4. Enable Realtime
-- Check if table is already in publication to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'campaigns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to publication. Ensure supabase_realtime publication exists.';
END $$;

-- 5. Enable RLS and Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on campaigns" ON campaigns;
CREATE POLICY "Allow public select on campaigns" ON campaigns FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public all on campaigns" ON campaigns;
CREATE POLICY "Allow public all on campaigns" ON campaigns FOR ALL TO public USING (true);
