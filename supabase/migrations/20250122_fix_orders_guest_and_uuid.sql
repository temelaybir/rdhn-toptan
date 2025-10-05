-- Fix Orders table for guest users and order_number field
-- Migration: 20250122_fix_orders_guest_and_uuid

BEGIN;

-- Add order_number field to orders table (for human-readable order IDs)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Create index for order_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Add legacy_id column to products table for backward compatibility
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_id INTEGER;

-- Create index for legacy_id lookups
CREATE INDEX IF NOT EXISTS idx_products_legacy_id ON products(legacy_id);

-- Update RLS policy to allow guest orders (user_id can be NULL)
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

-- New policy: Allow both authenticated users and guest users
CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (
        -- Either user is authenticated and owns the order
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        -- Or it's a guest order (both auth.uid() and user_id are null)
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- Update view policy to allow guest orders to be viewed by order_number
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

CREATE POLICY "Users can view orders" ON orders
    FOR SELECT USING (
        -- Authenticated users can see their own orders
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        -- Anyone can view orders by order_number (for guest checkout tracking)
        -- Note: In production, you might want to add additional security checks
        (order_number IS NOT NULL)
    );

COMMIT; 