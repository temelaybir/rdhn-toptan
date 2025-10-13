-- Add minimum_order_value column to site_settings
-- This is for MOV (Minimum Order Value) validation

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS minimum_order_value NUMERIC DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.site_settings.minimum_order_value IS 'Minimum order value (MOV) for wholesale - minimum total amount required';

-- Update existing row if needed
UPDATE public.site_settings
SET minimum_order_value = COALESCE(wholesale_mov, 0)
WHERE minimum_order_value IS NULL;

