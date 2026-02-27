-- MIGRATION TO CREATE MISSING menu_categories TABLE
-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'menu_categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to publication.';
END $$;

-- 3. Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
DROP POLICY IF EXISTS "Allow public read on menu_categories" ON menu_categories;
CREATE POLICY "Allow public read on menu_categories" ON menu_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public all on menu_categories" ON menu_categories;
CREATE POLICY "Allow public all on menu_categories" ON menu_categories FOR ALL TO public USING (true);

-- 5. Seed default categories if table is empty
INSERT INTO menu_categories (name)
SELECT name FROM (
    VALUES 
    ('Veg Pizza'),
    ('Chicken Pizza'),
    ('Burgers'),
    ('Sides'),
    ('Drinks')
) AS default_cats(name)
WHERE NOT EXISTS (SELECT 1 FROM menu_categories LIMIT 1)
ON CONFLICT (name) DO NOTHING;
