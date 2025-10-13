# =============================================================================
# Supabase Proje Klonlama Script (PowerShell - Windows)
# Mevcut proje: yujuwpbtziekevbcmrts (Ardahan Ticaret / catkapinda)
# Yeni proje: ardahanticaret-toptan
# =============================================================================

Write-Host ""
Write-Host "Supabase Proje Klonlama Islemi Basliyor..." -ForegroundColor Blue
Write-Host ""

# =============================================================================
# ADIM 1: PostgreSQL Araclarini Kontrol Et
# =============================================================================

Write-Host "PostgreSQL araclari kontrol ediliyor..." -ForegroundColor Yellow

$pgDumpPath = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
$psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source

if (-not $pgDumpPath) {
    Write-Host "pg_dump bulunamadi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "PostgreSQL araclarini yuklemek icin:" -ForegroundColor Yellow
    Write-Host "1. https://www.postgresql.org/download/windows/ adresine gidin"
    Write-Host "2. PostgreSQL'i indirin ve yukleyin"
    Write-Host "3. Bu scripti tekrar calistirin"
    Write-Host ""
    exit 1
}

Write-Host "PostgreSQL araclari bulundu" -ForegroundColor Green
Write-Host ""

# =============================================================================
# ADIM 2: Mevcut Proje Bilgileri
# =============================================================================

Write-Host "Mevcut Proje Bilgileri" -ForegroundColor Blue
Write-Host "Proje ID: yujuwpbtziekevbcmrts"
Write-Host "Proje Adi: Ardahan Ticaret (catkapinda.com.tr)"
Write-Host "Region: eu-central-1"
Write-Host "Tablo Sayisi: 59"
Write-Host "Urun Sayisi: 618"
Write-Host ""

# =============================================================================
# ADIM 3: Eski Proje Baglanti Bilgileri
# =============================================================================

Write-Host "Eski Proje Database Bilgilerini Girin:" -ForegroundColor Yellow
Write-Host ""

# Varsayilan degerler - catkapinda.com.tr projesi
$DEFAULT_OLD_HOST = "aws-0-eu-central-1.pooler.supabase.com"
$DEFAULT_OLD_USER = "postgres.yujuwpbtziekevbcmrts"
$DEFAULT_OLD_PASSWORD = "R0wNCKmNG7oPoNP5"
$DEFAULT_OLD_PORT = "6543"

$OLD_DB_HOST = Read-Host "Database Host [$DEFAULT_OLD_HOST]"
if ([string]::IsNullOrWhiteSpace($OLD_DB_HOST)) { $OLD_DB_HOST = $DEFAULT_OLD_HOST }

$OLD_DB_USER = Read-Host "Database User [$DEFAULT_OLD_USER]"
if ([string]::IsNullOrWhiteSpace($OLD_DB_USER)) { $OLD_DB_USER = $DEFAULT_OLD_USER }

$OLD_DB_PASSWORD = Read-Host "Database Password [$DEFAULT_OLD_PASSWORD]"
if ([string]::IsNullOrWhiteSpace($OLD_DB_PASSWORD)) { $OLD_DB_PASSWORD = $DEFAULT_OLD_PASSWORD }

$OLD_DB_PORT = Read-Host "Database Port [$DEFAULT_OLD_PORT]"
if ([string]::IsNullOrWhiteSpace($OLD_DB_PORT)) { $OLD_DB_PORT = $DEFAULT_OLD_PORT }

$OLD_DB_URL = "postgresql://${OLD_DB_USER}:${OLD_DB_PASSWORD}@${OLD_DB_HOST}:${OLD_DB_PORT}/postgres"

Write-Host ""

# =============================================================================
# ADIM 4: Yeni Proje Baglanti Bilgileri
# =============================================================================

Write-Host "Yeni Proje Database Bilgilerini Girin:" -ForegroundColor Yellow
Write-Host ""

# Varsayilan degerler - ardahanticaret-toptan projesi
$DEFAULT_NEW_HOST = "aws-1-eu-central-1.pooler.supabase.com"
$DEFAULT_NEW_USER = "postgres.rfdlhpcvdwhfemgupmof"
$DEFAULT_NEW_PASSWORD = "ybsQ4PWbSWHA3y41"
$DEFAULT_NEW_PORT = "6543"

$NEW_DB_HOST = Read-Host "Database Host [$DEFAULT_NEW_HOST]"
if ([string]::IsNullOrWhiteSpace($NEW_DB_HOST)) { $NEW_DB_HOST = $DEFAULT_NEW_HOST }

$NEW_DB_USER = Read-Host "Database User [$DEFAULT_NEW_USER]"
if ([string]::IsNullOrWhiteSpace($NEW_DB_USER)) { $NEW_DB_USER = $DEFAULT_NEW_USER }

$NEW_DB_PASSWORD = Read-Host "Database Password [$DEFAULT_NEW_PASSWORD]"
if ([string]::IsNullOrWhiteSpace($NEW_DB_PASSWORD)) { $NEW_DB_PASSWORD = $DEFAULT_NEW_PASSWORD }

$NEW_DB_PORT = Read-Host "Database Port [$DEFAULT_NEW_PORT]"
if ([string]::IsNullOrWhiteSpace($NEW_DB_PORT)) { $NEW_DB_PORT = $DEFAULT_NEW_PORT }

$NEW_DB_URL = "postgresql://${NEW_DB_USER}:${NEW_DB_PASSWORD}@${NEW_DB_HOST}:${NEW_DB_PORT}/postgres"

Write-Host ""

# =============================================================================
# ADIM 5: Backup Klasoru Olustur
# =============================================================================

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "supabase-backup-$timestamp"

New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null

Write-Host "Backup klasoru olusturuldu: $BACKUP_DIR" -ForegroundColor Green
Write-Host ""

# =============================================================================
# ADIM 6: Schema Backup (Tablo Yapilari)
# =============================================================================

Write-Host "Schema (Tablo Yapilari) Export Ediliyor..." -ForegroundColor Blue

$schemaFile = "$BACKUP_DIR\01_schema.sql"

$env:PGCLIENTENCODING = "UTF8"

& pg_dump $OLD_DB_URL `
  --schema-only `
  --no-owner `
  --no-acl `
  --schema=public `
  --encoding=UTF8 `
  --file=$schemaFile 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema basariyla export edildi" -ForegroundColor Green
} else {
    Write-Host "Schema export hatasi!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =============================================================================
# ADIM 7: Data Backup (Tum Veriler)
# =============================================================================

Write-Host "Veriler Export Ediliyor..." -ForegroundColor Blue
Write-Host "(Bu islem urun sayisina gore 2-5 dakika surebilir)" -ForegroundColor Yellow
Write-Host ""

$dataFile = "$BACKUP_DIR\02_data.sql"

$env:PGCLIENTENCODING = "UTF8"

& pg_dump $OLD_DB_URL `
  --data-only `
  --no-owner `
  --no-acl `
  --schema=public `
  --encoding=UTF8 `
  --file=$dataFile 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Veriler basariyla export edildi" -ForegroundColor Green
} else {
    Write-Host "Veri export hatasi!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =============================================================================
# ADIM 8: Yeni Projeye Schema Import
# =============================================================================

Write-Host "Yeni Projeye Schema Import Ediliyor..." -ForegroundColor Blue

$env:PGCLIENTENCODING = "UTF8"

Get-Content $schemaFile -Encoding UTF8 | & psql $NEW_DB_URL 2>&1 | Where-Object { $_ -notmatch "NOTICE" } | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema basariyla import edildi" -ForegroundColor Green
} else {
    Write-Host "Schema import hatasi!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =============================================================================
# ADIM 9: Yeni Projeye Data Import
# =============================================================================

Write-Host "Yeni Projeye Veriler Import Ediliyor..." -ForegroundColor Blue
Write-Host "(Bu islem urun sayisina gore 2-5 dakika surebilir)" -ForegroundColor Yellow
Write-Host ""

$env:PGCLIENTENCODING = "UTF8"

Get-Content $dataFile -Encoding UTF8 | & psql $NEW_DB_URL 2>&1 | Where-Object { $_ -notmatch "NOTICE" } | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Veriler basariyla import edildi" -ForegroundColor Green
} else {
    Write-Host "Veri import hatasi!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =============================================================================
# ADIM 10: Dogrulama
# =============================================================================

Write-Host "Import Dogrulamasi Yapiliyor..." -ForegroundColor Blue
Write-Host ""

# Tablo sayisini kontrol et
$TABLE_COUNT = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
Write-Host "Toplam Tablo: $($TABLE_COUNT.Trim())"

# Urun sayisini kontrol et
$PRODUCT_COUNT = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM products;"
Write-Host "Urun Sayisi: $($PRODUCT_COUNT.Trim())"

# Kategori sayisini kontrol et
$CATEGORY_COUNT = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM categories;"
Write-Host "Kategori Sayisi: $($CATEGORY_COUNT.Trim())"

# Siparis sayisini kontrol et
$ORDER_COUNT = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM orders;"
Write-Host "Siparis Sayisi: $($ORDER_COUNT.Trim())"

Write-Host ""

# =============================================================================
# ADIM 11: RLS Politikalarini Aktiflestir
# =============================================================================

Write-Host "RLS (Row Level Security) Politikalari Aktiflestiriliyor..." -ForegroundColor Blue

$rlsQuery = @'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
    END LOOP;
END $$;
'@

& psql $NEW_DB_URL -c $rlsQuery | Out-Null

Write-Host "RLS politikalari aktiflesti" -ForegroundColor Green
Write-Host ""

# =============================================================================
# ADIM 12: Storage Bucket'lari Olustur
# =============================================================================

Write-Host "Storage Bucket'lari Olusturuluyor..." -ForegroundColor Blue

$storageQuery = @'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;
'@

& psql $NEW_DB_URL -c $storageQuery | Out-Null

Write-Host "Storage bucket'lari olusturuldu" -ForegroundColor Green
Write-Host ""

# =============================================================================
# OZET
# =============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "KLONLAMA ISLEMI TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ozet:" -ForegroundColor Blue
Write-Host "Backup Klasoru: $BACKUP_DIR"
Write-Host "Tablo Sayisi: $($TABLE_COUNT.Trim())"
Write-Host "Urun Sayisi: $($PRODUCT_COUNT.Trim())"
Write-Host "Kategori Sayisi: $($CATEGORY_COUNT.Trim())"
Write-Host "Siparis Sayisi: $($ORDER_COUNT.Trim())"
Write-Host ""
Write-Host "Sonraki Adimlar:" -ForegroundColor Yellow
Write-Host "1. Supabase Dashboard'dan API anahtarlarini alin"
Write-Host "2. .env dosyasini yeni proje bilgileriyle guncelleyin"
Write-Host "3. Storage'daki gorselleri manuel olarak yukleyin (opsiyonel)"
Write-Host "4. Test edin: Urunlerin goruntulendigini kontrol edin"
Write-Host ""
Write-Host "Iyi calismalar!" -ForegroundColor Green
Write-Host ""
