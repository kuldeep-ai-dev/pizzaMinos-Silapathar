-- KDS SETTINGS MIGRATION
-- Create table for application-wide settings
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default KDS Password
-- NOTE: Change this value using the Supabase SQL editor if desired
INSERT INTO app_settings (key, value) 
VALUES ('kds_password', '1234')
ON CONFLICT (key) DO NOTHING;

-- Enable Realtime for app_settings
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
    RAISE NOTICE 'Could not add app_settings to publication.';
END $$;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read (for the KDS login check)
DROP POLICY IF EXISTS "Allow public select on app_settings" ON app_settings;
CREATE POLICY "Allow public select on app_settings" ON app_settings FOR SELECT TO public USING (true);
