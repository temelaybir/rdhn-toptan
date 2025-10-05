-- ============================================================================
-- İyzico Webhook URL Temizleme Migration
-- Tarih: 2025-01-22
-- Açıklama: Webhook endpoint kaldırıldığı için webhook URL'lerini temizle
-- ============================================================================

-- İyzico settings'te webhook URL'lerini temizle
UPDATE public.iyzico_settings 
SET webhook_url = NULL
WHERE webhook_url IS NOT NULL 
  AND webhook_url != '';

-- Güncelleme sonuçlarını logla
DO $$
BEGIN 
    RAISE NOTICE 'İyzico webhook URL''leri temizlendi!';
    RAISE NOTICE 'Artık sadece 3DS callback çalışacak, webhook gelmeyecek.';
END $$; 