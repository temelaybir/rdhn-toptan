# =============================================================================
# Supabase Backup - Custom Format (Verbose Mode)
# =============================================================================

Write-Host ""
Write-Host "Supabase Backup (Custom Format - Verbose) Basliyor..." -ForegroundColor Blue
Write-Host ""

# Database bilgileri
$OLD_DB_URL = "postgresql://postgres.yujuwpbtziekevbcmrts:R0wNCKmNG7oPoNP5@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
$NEW_DB_URL = "postgresql://postgres.rfdlhpcvdwhfemgupmof:ybsQ4PWbSWHA3y41@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

# Backup klasoru
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "supabase-backup-custom-$timestamp"
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null

Write-Host "Backup klasoru: $BACKUP_DIR" -ForegroundColor Green
Write-Host ""

# Custom format ile backup
Write-Host "Custom format ile backup aliniyor..." -ForegroundColor Blue

$backupFile = "$BACKUP_DIR\backup.dump"

$env:PGCLIENTENCODING = "UTF8"

& pg_dump $OLD_DB_URL `
  --format=custom `
  --no-owner `
  --no-acl `
  --schema=public `
  --verbose `
  --file=$backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup basarili!" -ForegroundColor Green
} else {
    Write-Host "Backup HATASI!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Backup dosya boyutu: $([math]::Round((Get-Item $backupFile).Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""

# Restore - VERBOSE MODE (hatalari gorecegiz)
Write-Host "Yeni DB'ye restore ediliyor..." -ForegroundColor Blue
Write-Host "HATALAR ASAGIDA GORUNECEK:" -ForegroundColor Yellow
Write-Host ""

& pg_restore --dbname=$NEW_DB_URL `
  --format=custom `
  --no-owner `
  --no-acl `
  --clean `
  --if-exists `
  --verbose `
  $backupFile

Write-Host ""
Write-Host "Restore exit code: $LASTEXITCODE" -ForegroundColor Cyan
Write-Host ""

# Dogrulama
Write-Host "Dogrulama yapiliyor..." -ForegroundColor Blue

$tableCount = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
Write-Host "Tablo sayisi: $($tableCount.Trim())"

$productCount = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM products;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Urun sayisi: $($productCount.Trim())" -ForegroundColor Green
} else {
    Write-Host "Products tablosu bulunamadi!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ISLEM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

