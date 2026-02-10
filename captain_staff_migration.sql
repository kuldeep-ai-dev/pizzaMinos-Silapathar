-- CAPTAIN APP & STAFF MANAGEMENT MIGRATION
-- This script sets up multi-user staff management and activity tracking.

-- 1. Create Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('captain', 'delivery')) DEFAULT 'captain',
    phone TEXT, -- Added for contact
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure phone column exists if table was already created
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Create Staff Activity Table
CREATE TABLE IF NOT EXISTS staff_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Orders Table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS received_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- 4. Update Order Items Table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS item_notes TEXT;

-- 5. Enable Security (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies
DROP POLICY IF EXISTS "Allow public all on staff" ON staff;
CREATE POLICY "Allow public all on staff" ON staff FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on staff_activity" ON staff_activity;
CREATE POLICY "Allow public all on staff_activity" ON staff_activity FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. Add default staff member
INSERT INTO staff (name, username, password, role)
VALUES ('Default Captain', 'captain1', 'cap123', 'captain')
ON CONFLICT (username) DO NOTHING;
