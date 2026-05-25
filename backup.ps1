# Script de Backup Automático para EstoqueSystem
# Uso: powershell -ExecutionPolicy Bypass -File backup.ps1

# CONFIGURAÇÕES
$ProjectPath = "C:\Users\locas\Documents\DocumentoEstoque"
$BackupBaseDir = "C:\Users\locas\Backups\DocumentoEstoque"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFolder = "$BackupBaseDir\backup_$Date"

Write-Host "Criando pasta de backup..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $BackupFolder | Out-Null

Write-Host "Copiando arquivos..." -ForegroundColor Cyan
Copy-Item -Path "$ProjectPath\src" -Destination "$BackupFolder\src" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$ProjectPath\public" -Destination "$BackupFolder\public" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$ProjectPath\package.json" -Destination "$BackupFolder\package.json" -Force
Copy-Item -Path "$ProjectPath\package-lock.json" -Destination "$BackupFolder\package-lock.json" -Force
Copy-Item -Path "$ProjectPath\tsconfig.json" -Destination "$BackupFolder\tsconfig.json" -Force
Copy-Item -Path "$ProjectPath\README.md" -Destination "$BackupFolder\README.md" -Force -ErrorAction SilentlyContinue

$fileCount = (Get-ChildItem $BackupFolder -Recurse | Measure-Object).Count
$size = (Get-ChildItem $BackupFolder -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local: $BackupFolder" -ForegroundColor Yellow
Write-Host "Arquivos: $fileCount" -ForegroundColor Yellow
Write-Host "Tamanho: $('{0:N2}' -f $size) MB" -ForegroundColor Yellow
Write-Host ""
