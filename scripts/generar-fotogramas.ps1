<#
.SYNOPSIS
  Genera los fotogramas del tutorial (scrollytelling) en WebP 1920x1080 a partir de un video o de una carpeta de imágenes.

.DESCRIPTION
  Requiere ffmpeg en el PATH (winget install Gyan.FFmpeg).
  Los fotogramas se publican con caché inmutable de un año, así que cada secuencia nueva
  debe ir en una carpeta nueva (-Version v3, v4...). Al terminar, actualiza FRAMES_VERSION y
  TOTAL_FRAMES en src/utils/preloadImages.ts y el patrón 'frames/<version>/*.webp' en vite.config.ts.

.EXAMPLE
  # Desde un video (recomendado: 1080p o 4K, sin marca de agua, cámara fija)
  .\scripts\generar-fotogramas.ps1 -Video C:\videos\postura-guantes.mp4 -Total 120 -Version v3

.EXAMPLE
  # Desde una carpeta con frame_001.jpg, frame_002.jpg...
  .\scripts\generar-fotogramas.ps1 -Carpeta .\public\frames -Version v3
#>
param(
    [string]$Video,
    [string]$Carpeta,
    [int]$Total = 78,
    [string]$Version = "v3",
    [int]$Ancho = 1920,
    [int]$Alto = 1080,
    [int]$Calidad = 80,
    [switch]$Limpiar   # aplica deblock y reducción de ruido (útil con fuentes muy comprimidas)
)

$ErrorActionPreference = "Stop"
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "No se encontró ffmpeg. Instálalo con: winget install Gyan.FFmpeg"
}
if (-not $Video -and -not $Carpeta) { Write-Error "Indica -Video o -Carpeta." }

$raiz = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $raiz "public\frames\$Version"
if (Test-Path $destino) { Write-Error "La carpeta $destino ya existe. Usa otra -Version." }
New-Item -ItemType Directory -Path $destino | Out-Null

# Escala con "cover" (rellena 16:9 sin deformar) y nitidez suave
$filtros = @()
if ($Limpiar) { $filtros += "deblock=filter=strong:block=8", "hqdn3d=1.5:1.5:3:3" }
$filtros += "scale=${Ancho}:${Alto}:force_original_aspect_ratio=increase:flags=lanczos", "crop=${Ancho}:${Alto}", "unsharp=5:5:0.45:5:5:0"

if ($Video) {
    # Toma $Total fotogramas repartidos de forma uniforme en toda la duración del video
    $duracion = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 "$Video")
    $fps = [math]::Round($Total / $duracion, 6)
    $vf = (@("fps=$fps") + $filtros) -join ","
    ffmpeg -hide_banner -loglevel error -i "$Video" -vf $vf -frames:v $Total -c:v libwebp -quality $Calidad -compression_level 6 (Join-Path $destino "frame_%03d.webp")
} else {
    $vf = $filtros -join ","
    ffmpeg -hide_banner -loglevel error -framerate 12 -i (Join-Path $Carpeta "frame_%03d.jpg") -vf $vf -c:v libwebp -quality $Calidad -compression_level 6 (Join-Path $destino "frame_%03d.webp")
}
if ($LASTEXITCODE -ne 0) { Write-Error "ffmpeg falló." }

$generados = (Get-ChildItem $destino -Filter *.webp).Count
$mb = [math]::Round(((Get-ChildItem $destino -Filter *.webp | Measure-Object Length -Sum).Sum / 1MB), 1)
Write-Host "Listo: $generados fotogramas en public\frames\$Version ($mb MB)." -ForegroundColor Green
Write-Host "Actualiza src/utils/preloadImages.ts: FRAMES_VERSION = '$Version' y TOTAL_FRAMES = $generados"
Write-Host "Actualiza vite.config.ts: 'frames/$Version/*.webp'"
