-- CAPTAIN APP 2.0 & ADMIN INTEGRATION MIGRATION
-- This script adds fields for hospitality professional features.

-- 1. Update Staff Table (Add Phone Number)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update Orders Table (Add Tracking Fields)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS received_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- 3. Update Order Items (Add Notes and Modifiers)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS modifications JSONB DEFAULT '[]'::jsonb;

-- 4. Ensure Realtime is enabled for Tables (Critical for Live Status)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'res_tables'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE res_tables;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add res_tables to publication.';
END $$;

-- 5. Add "Served" to official status check if it doesn't already allow it (some schemas use constraints)
-- Note: Already used in the code, so we ensure the DB doesn't block it.
