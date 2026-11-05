#!/bin/bash
set -e

STACK_NAME="${STACK_NAME:-guantes-frontend-stack}"
REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "=========================================================="
echo " Publicacion de Frontend a Amazon S3 y CloudFront"
echo " Stack:  $STACK_NAME"
echo " Region: $REGION"
echo "=========================================================="

# 1. Obtener salidas de CloudFormation (NombreBucket, IdDistribucion)
if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo "Consultando datos de despliegue desde CloudFormation ($STACK_NAME)..."
    OUTPUTS_JSON=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs" \
        --output json)

    BUCKET_NAME=$(echo "$OUTPUTS_JSON" | jq -r '.[] | select(.OutputKey=="NombreBucket") | .OutputValue')
    DISTRIBUTION_ID=$(echo "$OUTPUTS_JSON" | jq -r '.[] | select(.OutputKey=="IdDistribucion") | .OutputValue')
fi

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo "Error: No se pudieron obtener NombreBucket o IdDistribucion del stack $STACK_NAME."
    exit 1
fi

echo "-> Bucket S3:       $BUCKET_NAME"
echo "-> ID Distribucion: $DISTRIBUTION_ID"

# 2. Compilar aplicacion de produccion con npm ci y npm run build
echo ""
echo "Instalando dependencias y compilando frontend..."
cd "$FRONTEND_DIR"

if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Compilar con variables de .env.production (VITE_API_URL vacio para mismo dominio)
npm run build

DIST_DIR="$FRONTEND_DIR/dist"
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: El directorio dist/ no fue generado."
    exit 1
fi

# 3. Sincronizar con S3 en dos pasadas
echo ""
echo "Paso 1/2: Subiendo archivos inmutables y con hash (assets, imagenes, modelos)..."
aws s3 sync "$DIST_DIR" "s3://$BUCKET_NAME" \
    --delete \
    --exclude "index.html" \
    --exclude "sw.js" \
    --exclude "registerSW.js" \
    --exclude "manifest.webmanifest" \
    --exclude "workbox-*.js" \
    --cache-control "public, max-age=31536000, immutable" \
    --region "$REGION"

echo "Paso 2/2: Subiendo archivos mutables (index.html, service worker, manifiesto)..."
aws s3 sync "$DIST_DIR" "s3://$BUCKET_NAME" \
    --exclude "*" \
    --include "index.html" \
    --include "sw.js" \
    --include "registerSW.js" \
    --include "manifest.webmanifest" \
    --include "workbox-*.js" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --region "$REGION"

# 4. Ajustar Content-Type de tipos MIME especiales
echo ""
echo "Ajustando tipos MIME especificos (.wasm, .task, .webmanifest, .bin)..."

# .webmanifest -> application/manifest+json
if [ -f "$DIST_DIR/manifest.webmanifest" ]; then
    aws s3 cp "s3://$BUCKET_NAME/manifest.webmanifest" "s3://$BUCKET_NAME/manifest.webmanifest" \
        --metadata-directive REPLACE \
        --content-type "application/manifest+json" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --region "$REGION" > /dev/null
fi

# .wasm -> application/wasm
aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
    --recursive \
    --exclude "*" \
    --include "*.wasm" \
    --metadata-directive REPLACE \
    --content-type "application/wasm" \
    --cache-control "public, max-age=31536000, immutable" \
    --region "$REGION" > /dev/null 2>&1 || true

# .task -> application/octet-stream
aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
    --recursive \
    --exclude "*" \
    --include "*.task" \
    --metadata-directive REPLACE \
    --content-type "application/octet-stream" \
    --cache-control "public, max-age=31536000, immutable" \
    --region "$REGION" > /dev/null 2>&1 || true

# .bin -> application/octet-stream
aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
    --recursive \
    --exclude "*" \
    --include "*.bin" \
    --metadata-directive REPLACE \
    --content-type "application/octet-stream" \
    --cache-control "public, max-age=31536000, immutable" \
    --region "$REGION" > /dev/null 2>&1 || true

# 5. Invalidacion selectiva en CloudFront
echo ""
echo "Creando invalidacion selectiva en CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/index.html" "/sw.js" "/registerSW.js" "/manifest.webmanifest" \
    --query "Invalidation.Id" \
    --output text \
    --region "$REGION")

echo "-> Invalidacion solicitada con ID: $INVALIDATION_ID"
echo ""
echo "=========================================================="
echo " Publicacion de frontend completada exitosamente!"
echo "=========================================================="
