-- Backfill Analytics for Today's Orders
-- This will populate preparing_at and completed_at with estimates 
-- based on created_at for orders that are already served or delivered.

UPDATE orders
SET 
  preparing_at = created_at + interval '2 minutes',
  ready_at = created_at + interval '12 minutes',
  completed_at = created_at + interval '15 minutes'
WHERE 
  (status = 'Served' OR status = 'Delivered' OR status = 'Payment Completed')
  AND preparing_at IS NULL;

-- Also set preparing_at for currently preparing orders
UPDATE orders
SET 
  preparing_at = created_at + interval '1 minute'
WHERE 
  status = 'Preparing'
  AND preparing_at IS NULL;
