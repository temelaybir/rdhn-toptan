-- =============================================================================
-- Turkce Karakter Duzeltme Script
-- Database'deki tum text alanlari LATIN1'den UTF8'e donusturur
-- =============================================================================

-- ADIM 1: Products tablosu
UPDATE products SET 
  name = convert_from(convert_to(name, 'LATIN1'), 'UTF8'),
  description = CASE 
    WHEN description IS NOT NULL 
    THEN convert_from(convert_to(description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  short_description = CASE 
    WHEN short_description IS NOT NULL 
    THEN convert_from(convert_to(short_description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 2: Categories tablosu
UPDATE categories SET 
  name = convert_from(convert_to(name, 'LATIN1'), 'UTF8'),
  description = CASE 
    WHEN description IS NOT NULL 
    THEN convert_from(convert_to(description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 3: Customers tablosu
UPDATE customers SET 
  first_name = CASE 
    WHEN first_name IS NOT NULL 
    THEN convert_from(convert_to(first_name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  last_name = CASE 
    WHEN last_name IS NOT NULL 
    THEN convert_from(convert_to(last_name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  company_name = CASE 
    WHEN company_name IS NOT NULL 
    THEN convert_from(convert_to(company_name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  address = CASE 
    WHEN address IS NOT NULL 
    THEN convert_from(convert_to(address, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  city = CASE 
    WHEN city IS NOT NULL 
    THEN convert_from(convert_to(city, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  district = CASE 
    WHEN district IS NOT NULL 
    THEN convert_from(convert_to(district, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  notes = CASE 
    WHEN notes IS NOT NULL 
    THEN convert_from(convert_to(notes, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 4: Customer Addresses tablosu
UPDATE customer_addresses SET 
  address_line1 = CASE 
    WHEN address_line1 IS NOT NULL 
    THEN convert_from(convert_to(address_line1, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  address_line2 = CASE 
    WHEN address_line2 IS NOT NULL 
    THEN convert_from(convert_to(address_line2, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  city = CASE 
    WHEN city IS NOT NULL 
    THEN convert_from(convert_to(city, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  district = CASE 
    WHEN district IS NOT NULL 
    THEN convert_from(convert_to(district, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 5: Orders tablosu
UPDATE orders SET 
  shipping_address = CASE 
    WHEN shipping_address IS NOT NULL 
    THEN convert_from(convert_to(shipping_address, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  billing_address = CASE 
    WHEN billing_address IS NOT NULL 
    THEN convert_from(convert_to(billing_address, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  customer_notes = CASE 
    WHEN customer_notes IS NOT NULL 
    THEN convert_from(convert_to(customer_notes, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  admin_notes = CASE 
    WHEN admin_notes IS NOT NULL 
    THEN convert_from(convert_to(admin_notes, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 6: Site Settings tablosu
UPDATE site_settings SET 
  site_name = CASE 
    WHEN site_name IS NOT NULL 
    THEN convert_from(convert_to(site_name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  site_title = CASE 
    WHEN site_title IS NOT NULL 
    THEN convert_from(convert_to(site_title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  site_description = CASE 
    WHEN site_description IS NOT NULL 
    THEN convert_from(convert_to(site_description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  contact_address = CASE 
    WHEN contact_address IS NOT NULL 
    THEN convert_from(convert_to(contact_address, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 7: Promo Codes tablosu
UPDATE promo_codes SET 
  description = CASE 
    WHEN description IS NOT NULL 
    THEN convert_from(convert_to(description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 8: Invoices tablosu
UPDATE invoices SET 
  customer_name = CASE 
    WHEN customer_name IS NOT NULL 
    THEN convert_from(convert_to(customer_name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  customer_address = CASE 
    WHEN customer_address IS NOT NULL 
    THEN convert_from(convert_to(customer_address, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  notes = CASE 
    WHEN notes IS NOT NULL 
    THEN convert_from(convert_to(notes, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 9: Campaign Banners tablosu
UPDATE campaign_banners SET 
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL 
    THEN convert_from(convert_to(description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 10: Hero Slides tablosu
UPDATE hero_slides SET 
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  subtitle = CASE 
    WHEN subtitle IS NOT NULL 
    THEN convert_from(convert_to(subtitle, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL 
    THEN convert_from(convert_to(description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 11: Internal Pages tablosu
UPDATE internal_pages SET 
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  content = CASE 
    WHEN content IS NOT NULL 
    THEN convert_from(convert_to(content, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 12: Site Pages tablosu
UPDATE site_pages SET 
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  content = CASE 
    WHEN content IS NOT NULL 
    THEN convert_from(convert_to(content, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 13: Site Announcements tablosu
UPDATE site_announcements SET 
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  message = CASE 
    WHEN message IS NOT NULL 
    THEN convert_from(convert_to(message, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 14: Footer Links tablosu
UPDATE footer_links SET 
  text = CASE 
    WHEN text IS NOT NULL 
    THEN convert_from(convert_to(text, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 15: Footer Link Groups tablosu
UPDATE footer_link_groups SET 
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 16: Header Menu Items tablosu
UPDATE header_menu_items SET 
  label = CASE 
    WHEN label IS NOT NULL 
    THEN convert_from(convert_to(label, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  title = CASE 
    WHEN title IS NOT NULL 
    THEN convert_from(convert_to(title, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 17: Header Quick Links tablosu
UPDATE header_quick_links SET 
  text = CASE 
    WHEN text IS NOT NULL 
    THEN convert_from(convert_to(text, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 18: Product Collections tablosu
UPDATE product_collections SET 
  name = CASE 
    WHEN name IS NOT NULL 
    THEN convert_from(convert_to(name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL 
    THEN convert_from(convert_to(description, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- ADIM 19: Featured Brands tablosu
UPDATE featured_brands SET 
  name = CASE 
    WHEN name IS NOT NULL 
    THEN convert_from(convert_to(name, 'LATIN1'), 'UTF8')
    ELSE NULL 
  END;

-- =============================================================================
-- TEST SORGUSU - Turkce karakterlerin duzgun gorunup gorunmedigini kontrol edin
-- =============================================================================

-- Products tablosundan ornekler
SELECT 'PRODUCTS' as tablo, name, description 
FROM products 
WHERE name IS NOT NULL
LIMIT 5;

-- Categories tablosundan ornekler
SELECT 'CATEGORIES' as tablo, name, description 
FROM categories 
WHERE name IS NOT NULL
LIMIT 5;

-- Site Settings
SELECT 'SITE_SETTINGS' as tablo, site_name as name, site_description as description
FROM site_settings
LIMIT 1;
