# =============================================================================
# Supabase Database Temizleme Script (PowerShell - Windows)
# Tum tablolari ve verileri siler
# =============================================================================

Write-Host ""
Write-Host "Supabase Database Temizleme Islemi Basliyor..." -ForegroundColor Blue
Write-Host ""

# =============================================================================
# ADIM 1: PostgreSQL Araclarini Kontrol Et
# =============================================================================

Write-Host "PostgreSQL araclari kontrol ediliyor..." -ForegroundColor Yellow

$psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source

if (-not $psqlPath) {
    Write-Host "psql bulunamadi!" -ForegroundColor Red
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
# ADIM 2: Yeni Proje Database Baglanti Bilgileri
# =============================================================================

Write-Host "Temizlenecek Database Bilgileri:" -ForegroundColor Yellow
Write-Host ""

# Varsayilan degerler
$DEFAULT_DB_HOST = "aws-1-eu-central-1.pooler.supabase.com"
$DEFAULT_DB_USER = "postgres.rfdlhpcvdwhfemgupmof"
$DEFAULT_DB_PORT = "6543"
$DEFAULT_DB_PASSWORD = "ybsQ4PWbSWHA3y41"

$DB_HOST = Read-Host "Database Host [$DEFAULT_DB_HOST]"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = $DEFAULT_DB_HOST }

$DB_USER = Read-Host "Database User [$DEFAULT_DB_USER]"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = $DEFAULT_DB_USER }

$DB_PASSWORD = Read-Host "Database Password [$DEFAULT_DB_PASSWORD]"
if ([string]::IsNullOrWhiteSpace($DB_PASSWORD)) { $DB_PASSWORD = $DEFAULT_DB_PASSWORD }

$DB_PORT = Read-Host "Database Port [$DEFAULT_DB_PORT]"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = $DEFAULT_DB_PORT }

$DB_URL = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres"

Write-Host ""

# =============================================================================
# ADIM 3: Onay Al
# =============================================================================

Write-Host "UYARI: Bu islem tum tablolari ve verileri SILECEKTIR!" -ForegroundColor Red
Write-Host ""
Write-Host "Database: $DB_HOST" -ForegroundColor Yellow
Write-Host "User: $DB_USER" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Devam etmek istediginizden emin misiniz? (EVET yazin)"

if ($confirmation -ne "EVET") {
    Write-Host ""
    Write-Host "Islem iptal edildi" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# =============================================================================
# ADIM 4: Mevcut Tablolari Listele
# =============================================================================

Write-Host "Mevcut tablolar kontrol ediliyor..." -ForegroundColor Blue

$tableListQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

$tableCount = & psql $DB_URL -t -c $tableListQuery 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Toplam Tablo Sayisi: $($tableCount.Trim())" -ForegroundColor Cyan
} else {
    Write-Host "Tablolar listelenemedi!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =============================================================================
# ADIM 5: Tum Tablolari Sil (DROP)
# =============================================================================

Write-Host "Tum tablolar siliniyor..." -ForegroundColor Blue

$dropTablesQuery = @'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || 
                ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    END LOOP;
    
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
'@

& psql $DB_URL -c $dropTablesQuery 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Tum tablolar basariyla silindi" -ForegroundColor Green
} else {
    Write-Host "Tablolar silinirken hata olustu!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# =============================================================================
# ADIM 6: Tum Sequence'leri Sil
# =============================================================================

Write-Host "Sequence'ler siliniyor..." -ForegroundColor Blue

$dropSequencesQuery = @'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;
'@

& psql $DB_URL -c $dropSequencesQuery 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sequence'ler basariyla silindi" -ForegroundColor Green
} else {
    Write-Host "Sequence'ler silinirken hata olustu (normal olabilir)" -ForegroundColor Yellow
}

Write-Host ""

# =============================================================================
# ADIM 7: Tum Custom Type'lari Sil
# =============================================================================

Write-Host "Custom type'lar siliniyor..." -ForegroundColor Blue

$dropTypesQuery = @'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT typname
        FROM pg_type
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;
'@

& psql $DB_URL -c $dropTypesQuery 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Custom type'lar basariyla silindi" -ForegroundColor Green
} else {
    Write-Host "Custom type'lar silinirken hata olustu (normal olabilir)" -ForegroundColor Yellow
}

Write-Host ""

# =============================================================================
# ADIM 8: Dogrulama
# =============================================================================

Write-Host "Temizleme dogrulamasi yapiliyor..." -ForegroundColor Blue

$verifyQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

$finalTableCount = & psql $DB_URL -t -c $verifyQuery 2>&1

Write-Host "Kalan Tablo Sayisi: $($finalTableCount.Trim())" -ForegroundColor Cyan

Write-Host ""

# =============================================================================
# OZET
# =============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TEMIZLEME ISLEMI TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ozet:" -ForegroundColor Blue
Write-Host "Silinen Tablo Sayisi: $($tableCount.Trim())"
Write-Host "Kalan Tablo Sayisi: $($finalTableCount.Trim())"
Write-Host ""
Write-Host "Sonraki Adim:" -ForegroundColor Yellow
Write-Host "Simdi backup-and-clone-supabase.ps1 scriptini calistirarak"
Write-Host "eski database'den verileri klonlayabilirsiniz."
Write-Host ""
Write-Host "Database temizlendi!" -ForegroundColor Green
Write-Host ""
