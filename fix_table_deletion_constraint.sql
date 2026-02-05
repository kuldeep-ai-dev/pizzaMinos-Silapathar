-- FIX FOR TABLE DELETION CONSTRAINT ERROR
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Identify and drop the existing constraint if it exists
-- The error message identified it as "orders_table_id_fkey"
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_table_id_fkey;

-- 2. Re-add the constraint with ON DELETE SET NULL
-- This ensures that if a table is deleted, the table_id in the orders table becomes NULL 
-- rather than blocking the deletion or deleting the order itself.
ALTER TABLE orders
ADD CONSTRAINT orders_table_id_fkey 
FOREIGN KEY (table_id) 
REFERENCES res_tables(id) 
ON DELETE SET NULL;
