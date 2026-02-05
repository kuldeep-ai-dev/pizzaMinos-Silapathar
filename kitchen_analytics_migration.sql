-- Add Kitchen Performance Timestamps to Orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Comment for clarity
COMMENT ON COLUMN orders.preparing_at IS 'When the first item in the order started being prepared';
COMMENT ON COLUMN orders.ready_at IS 'When all items in the order reached Prepared state';
COMMENT ON COLUMN orders.completed_at IS 'When the order was served or delivered';
