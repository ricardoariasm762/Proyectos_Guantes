#!/bin/bash
set -e

STACK_NAME="${STACK_NAME:-guantes-frontend-stack}"
BACKEND_STACK_NAME="${BACKEND_STACK_NAME:-guantes-backend-stack}"
REGION="${AWS_REGION:-us-east-2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="$(cd "$SCRIPT_DIR/.." && pwd)/frontend.yaml"

echo "=========================================================="
echo " Despliegue de Infraestructura Frontend (S3 + CloudFront)"
echo " Stack:     $STACK_NAME"
echo " Region:    $REGION"
echo " Plantilla: $TEMPLATE_FILE"
echo "=========================================================="

# 1. Obtener DNS publico de EC2 si no se especifico
if [ -z "$EC2_PUBLIC_DNS" ]; then
    echo "Consultando DnsPublicoEC2 desde el stack de backend ($BACKEND_STACK_NAME)..."
    EC2_PUBLIC_DNS=$(aws cloudformation describe-stacks \
        --stack-name "$BACKEND_STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='DnsPublicoEC2'].OutputValue" \
        --output text 2>/dev/null || echo "")
fi

if [ -z "$EC2_PUBLIC_DNS" ] || [ "$EC2_PUBLIC_DNS" = "None" ]; then
    echo "Error: No se pudo obtener el DNS publico de EC2. Por favor proporciona la variable EC2_PUBLIC_DNS."
    exit 1
fi

echo "-> EC2 Public DNS: $EC2_PUBLIC_DNS"

# 2. Validar plantilla con cfn-lint si esta disponible
if command -v cfn-lint &> /dev/null; then
    echo "Validando plantilla con cfn-lint..."
    cfn-lint "$TEMPLATE_FILE"
    echo "-> Plantilla valida."
fi

# 3. Desplegar con CloudFormation
echo "Iniciando despliegue de CloudFormation..."
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        EC2PublicDns="$EC2_PUBLIC_DNS" \
    --region "$REGION"

echo ""
echo "=========================================================="
echo " Despliegue de frontend completado exitosamente!"
echo " Salidas del Stack:"
echo "=========================================================="
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs" \
    --output table
