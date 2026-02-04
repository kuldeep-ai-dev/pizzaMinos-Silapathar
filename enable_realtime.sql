-- ENABLE REALTIME FOR ORDERS AND ORDER ITEMS
-- This version handles the publication creation if it doesn't exist.

-- 1. Create the publication if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Add tables to the realtime publication
-- We use a DO block to catch "already added" errors gracefully
DO $$
BEGIN
  -- Clear existing if needed (Optional: uncomment if force re-adding is desired)
  -- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders, order_items;
  
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Table orders already in publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Table order_items already in publication';
END $$;

-- 3. Set replica identity to FULL
-- CRITICAL: This allows the database to send full record details on change
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
