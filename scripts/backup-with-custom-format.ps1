# =============================================================================
# Supabase Backup - Custom Format (Encoding Sorunlarini Cozebilir)
# =============================================================================

Write-Host ""
Write-Host "Supabase Backup (Custom Format) Basliyor..." -ForegroundColor Blue
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

# Custom format ile backup (binary, encoding sorunlari olmaz)
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
} else {
    Write-Host "Backup HATASI!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Restore
Write-Host "Yeni DB'ye restore ediliyor..." -ForegroundColor Blue

& pg_restore $NEW_DB_URL `
  --format=custom `
  --no-owner `
  --no-acl `
  --clean `
  --if-exists `
  $backupFile 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore basarili!" -ForegroundColor Green
} else {
    Write-Host "Restore tamamlandi (bazi hatalar normal olabilir)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ISLEM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup dosyasi: $backupFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test edin:" -ForegroundColor Yellow
Write-Host "psql `"$NEW_DB_URL`" -c `"SELECT name FROM products LIMIT 5;`""
Write-Host ""

