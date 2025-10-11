-- Promosyon kodları ve kullanım kayıtlarını temizle

-- Önce kullanım kayıtlarını sil (foreign key nedeniyle)
DELETE FROM promo_code_usage;

-- Sonra promosyon kodlarını sil
DELETE FROM promo_codes;

-- Serial ID'yi sıfırla (sequence adı otomatik tespit edilir)
SELECT setval(pg_get_serial_sequence('promo_codes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('promo_code_usage', 'id'), 1, false);

