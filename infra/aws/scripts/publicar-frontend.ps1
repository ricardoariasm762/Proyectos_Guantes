param (
    [string]$StackName = "guantes-frontend-stack",
    [string]$Region = "us-east-2",
    [string]$BucketName = "",
    [string]$DistributionId = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptDir))

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Publicacion de Frontend a Amazon S3 y CloudFront" -ForegroundColor Cyan
Write-Host " Stack:  $StackName" -ForegroundColor Cyan
Write-Host " Region: $Region" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Obtener salidas de CloudFormation (NombreBucket, IdDistribucion)
if ([string]::IsNullOrWhiteSpace($BucketName) -or [string]::IsNullOrWhiteSpace($DistributionId)) {
    Write-Host "Consultando datos de despliegue desde CloudFormation ($StackName)..." -ForegroundColor Yellow
    $outputsRaw = aws cloudformation describe-stacks `
        --stack-name "$StackName" `
        --region "$Region" `
        --query "Stacks[0].Outputs" `
        --output json | ConvertFrom-Json

    if ([string]::IsNullOrWhiteSpace($BucketName)) {
        $BucketName = ($outputsRaw | Where-Object { $_.OutputKey -eq "NombreBucket" }).OutputValue
    }
    if ([string]::IsNullOrWhiteSpace($DistributionId)) {
        $DistributionId = ($outputsRaw | Where-Object { $_.OutputKey -eq "IdDistribucion" }).OutputValue
    }
}

if ([string]::IsNullOrWhiteSpace($BucketName) -or [string]::IsNullOrWhiteSpace($DistributionId)) {
    Write-Error "Error: No se pudieron obtener NombreBucket o IdDistribucion del stack $StackName."
    exit 1
}

Write-Host "-> Bucket S3:       $BucketName" -ForegroundColor Green
Write-Host "-> ID Distribucion: $DistributionId" -ForegroundColor Green

# 2. Compilar aplicacion de produccion con npm ci y npm run build
Write-Host ""
Write-Host "Instalando dependencias y compilando frontend..." -ForegroundColor Yellow
Push-Location "$frontendDir"
try {
    if (Test-Path "package-lock.json") {
        npm ci
    } else {
        npm install
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

$distDir = Join-Path $frontendDir "dist"
if (-not (Test-Path $distDir)) {
    Write-Error "Error: El directorio dist/ no fue generado."
    exit 1
}

# 3. Sincronizar con S3 en dos pasadas
Write-Host ""
Write-Host "Paso 1/2: Subiendo archivos inmutables y con hash (assets, imagenes, modelos)..." -ForegroundColor Yellow
aws s3 sync "$distDir" "s3://$BucketName" `
    --delete `
    --exclude "index.html" `
    --exclude "sw.js" `
    --exclude "registerSW.js" `
    --exclude "manifest.webmanifest" `
    --exclude "workbox-*.js" `
    --cache-control "public, max-age=31536000, immutable" `
    --region "$Region"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: la subida a S3 fallo (revisa la sesion con aws login)." -ForegroundColor Red; exit 1 }

Write-Host "Paso 2/2: Subiendo archivos mutables (index.html, service worker, manifiesto)..." -ForegroundColor Yellow
aws s3 sync "$distDir" "s3://$BucketName" `
    --exclude "*" `
    --include "index.html" `
    --include "sw.js" `
    --include "registerSW.js" `
    --include "manifest.webmanifest" `
    --include "workbox-*.js" `
    --cache-control "no-cache, no-store, must-revalidate" `
    --region "$Region"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: la subida a S3 fallo (revisa la sesion con aws login)." -ForegroundColor Red; exit 1 }

# 4. Ajustar Content-Type de tipos MIME especiales
Write-Host ""
Write-Host "Ajustando tipos MIME especificos (.wasm, .task, .webmanifest, .bin, .webp)..." -ForegroundColor Yellow

# .webmanifest -> application/manifest+json
if (Test-Path (Join-Path $distDir "manifest.webmanifest")) {
    aws s3 cp "s3://$BucketName/manifest.webmanifest" "s3://$BucketName/manifest.webmanifest" `
        --metadata-directive REPLACE `
        --content-type "application/manifest+json" `
        --cache-control "no-cache, no-store, must-revalidate" `
        --region "$Region" | Out-Null
}

# .wasm -> application/wasm
aws s3 cp "s3://$BucketName" "s3://$BucketName" `
    --recursive `
    --exclude "*" `
    --include "*.wasm" `
    --metadata-directive REPLACE `
    --content-type "application/wasm" `
    --cache-control "public, max-age=31536000, immutable" `
    --region "$Region" 2>$null | Out-Null

# .task -> application/octet-stream
aws s3 cp "s3://$BucketName" "s3://$BucketName" `
    --recursive `
    --exclude "*" `
    --include "*.task" `
    --metadata-directive REPLACE `
    --content-type "application/octet-stream" `
    --cache-control "public, max-age=31536000, immutable" `
    --region "$Region" 2>$null | Out-Null

# .webp -> image/webp (fotogramas del tutorial)
aws s3 cp "s3://$BucketName" "s3://$BucketName" `
    --recursive `
    --exclude "*" `
    --include "*.webp" `
    --metadata-directive REPLACE `
    --content-type "image/webp" `
    --cache-control "public, max-age=31536000, immutable" `
    --region "$Region" 2>$null | Out-Null

# .bin -> application/octet-stream
aws s3 cp "s3://$BucketName" "s3://$BucketName" `
    --recursive `
    --exclude "*" `
    --include "*.bin" `
    --metadata-directive REPLACE `
    --content-type "application/octet-stream" `
    --cache-control "public, max-age=31536000, immutable" `
    --region "$Region" 2>$null | Out-Null

# 5. Invalidacion selectiva en CloudFront
Write-Host ""
Write-Host "Creando invalidacion selectiva en CloudFront..." -ForegroundColor Yellow
$invalidationId = (aws cloudfront create-invalidation `
    --distribution-id "$DistributionId" `
    --paths "/index.html" "/sw.js" "/registerSW.js" "/manifest.webmanifest" `
    --query "Invalidation.Id" `
    --output text `
    --region "$Region")
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: la invalidacion de CloudFront fallo." -ForegroundColor Red; exit 1 }
$invalidationId = "$invalidationId".Trim()

Write-Host "-> Invalidacion solicitada con ID: $invalidationId" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Publicacion de frontend completada exitosamente!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
