# Run on Windows server OR locally before FTP upload.
# Adjust paths, then: powershell -ExecutionPolicy Bypass -File scripts/deploy-server.ps1

$ErrorActionPreference = "Stop"
$RepoDir = if ($env:REPO_DIR) { $env:REPO_DIR } else { "C:\Laxmi-Libas-Quick-Commerce" }
$WebRoot = if ($env:WEB_ROOT) { $env:WEB_ROOT } else { "C:\inetpub\wwwroot\laxmart" }

Write-Host "==> Deploy from $RepoDir"
Set-Location $RepoDir
git pull origin main

Write-Host "==> backend"
Set-Location "$RepoDir\backend"
npm install
npm run build
# Restart your backend service here (pm2/iis/node windows service)

Write-Host "==> frontend"
Set-Location "$RepoDir\frontend"
npm install
npm run build

Write-Host "==> copy dist -> $WebRoot"
if (-not (Test-Path $WebRoot)) { New-Item -ItemType Directory -Path $WebRoot | Out-Null }
robocopy "$RepoDir\frontend\dist" $WebRoot /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

Write-Host "==> done. Hard refresh browser (Ctrl+Shift+R)."
