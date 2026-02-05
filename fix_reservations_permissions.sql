-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX RESERVATION DELETION

-- 1. Enable RLS if not already enabled (usually is by default)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow anonymous/public deletion
-- This allows anyone with the anon key (your admin panel) to delete records
CREATE POLICY "Allow public delete on reservations" 
ON reservations 
FOR DELETE 
TO public 
USING (true);

-- 3. Create policy to allow anonymous/public updates (if you use status confirmed/restored)
CREATE POLICY "Allow public update on reservations" 
ON reservations 
FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- 4. Create policy to allow anonymous/public select
CREATE POLICY "Allow public select on reservations" 
ON reservations 
FOR SELECT 
TO public 
USING (true);
