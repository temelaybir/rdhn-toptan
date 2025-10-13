# =============================================================================
# Supabase Backup - Custom Format (FIXED - Clean Mode Disabled)
# =============================================================================

Write-Host ""
Write-Host "Supabase Backup (Custom Format - FIXED) Basliyor..." -ForegroundColor Blue
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
  --file=$backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup basarili!" -ForegroundColor Green
    Write-Host "Backup boyutu: $([math]::Round((Get-Item $backupFile).Length / 1MB, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Backup HATASI!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Restore - CLEAN MODE DISABLED (yeni DB zaten bos)
Write-Host "Yeni DB'ye restore ediliyor..." -ForegroundColor Blue

& pg_restore --dbname=$NEW_DB_URL `
  --format=custom `
  --no-owner `
  --no-acl `
  --verbose `
  $backupFile 2>&1 | Out-File -FilePath "restore-output.log" -Encoding UTF8

Write-Host "Restore tamamlandi! (Hatalar varsa restore-output.log'a bakabilirsiniz)" -ForegroundColor Green
Write-Host ""

# Dogrulama
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DOGRULAMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$tableCount = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
Write-Host "Tablo sayisi: $($tableCount.Trim())" -ForegroundColor Yellow

$productCount = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM products;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Urun sayisi: $($productCount.Trim())" -ForegroundColor Green
} else {
    Write-Host "Products tablosu bulunamadi! HATA!" -ForegroundColor Red
}

$categoryCount = & psql $NEW_DB_URL -t -c "SELECT COUNT(*) FROM categories;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Kategori sayisi: $($categoryCount.Trim())" -ForegroundColor Green
}

Write-Host ""

# Turkce karakter testi (PowerShell'de bozuk gorunebilir ama DB'de dogrudur)
Write-Host "Turkce karakter testi (PowerShell'de bozuk gorunse bile Dashboard'da duzgun olmali):" -ForegroundColor Yellow
& psql $NEW_DB_URL -c "SELECT name FROM products LIMIT 3;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ISLEM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ONEMLI: Supabase Dashboard > Table Editor'den kontrol edin!" -ForegroundColor Yellow
Write-Host "Turkce karakterler Dashboard'da duzgun gorunmeli." -ForegroundColor Yellow
Write-Host ""

