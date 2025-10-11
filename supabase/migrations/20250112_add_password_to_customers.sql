-- Add password field to customers table for traditional login
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for faster email lookups during login
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Comment
COMMENT ON COLUMN customers.password_hash IS 'Bcrypt hashed password for traditional login';

