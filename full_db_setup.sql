-- FULL DATABASE SETUP FOR APP SETTINGS
-- run this entire script to fix the "relation does not exist" error

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Realtime (optional, good for KDS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add app_settings to publication (might already be added).';
END $$;

-- 3. Enable Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read access (needed for login checks)
DROP POLICY IF EXISTS "Allow public select on app_settings" ON app_settings;
CREATE POLICY "Allow public select on app_settings" ON app_settings FOR SELECT TO public USING (true);

-- 5. Allow full access for public (needed for MG Dashboard)
DROP POLICY IF EXISTS "Allow public all on app_settings" ON app_settings;
CREATE POLICY "Allow public all on app_settings" ON app_settings 
FOR ALL TO public 
USING (true) 
WITH CHECK (true);

-- 6. Insert Default Credentials
INSERT INTO app_settings (key, value)
VALUES 
  ('kds_password', '1234'),
  ('admin_username', 'admin'),
  ('admin_password', 'pizza7870'),
  ('mg_password', 'meny123')
ON CONFLICT (key) DO NOTHING;
