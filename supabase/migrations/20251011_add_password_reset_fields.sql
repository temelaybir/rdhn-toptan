-- Add password reset fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_customers_password_reset_token 
ON customers(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN customers.password_reset_token IS 'Token for password reset functionality';
COMMENT ON COLUMN customers.password_reset_expires IS 'Expiration timestamp for password reset token';

