param (
    [string]$StackName = "guantes-frontend-stack",
    [string]$BackendStackName = "guantes-backend-stack",
    [string]$Region = "us-east-2",
    [string]$EC2PublicDns = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$templateFile = Join-Path (Split-Path -Parent $scriptDir) "frontend.yaml"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Despliegue de Infraestructura Frontend (S3 + CloudFront)" -ForegroundColor Cyan
Write-Host " Stack:     $StackName" -ForegroundColor Cyan
Write-Host " Region:    $Region" -ForegroundColor Cyan
Write-Host " Plantilla: $templateFile" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Obtener DNS publico de EC2 si no se especifico
if ([string]::IsNullOrWhiteSpace($EC2PublicDns)) {
    Write-Host "Consultando DnsPublicoEC2 desde el stack de backend ($BackendStackName)..." -ForegroundColor Yellow
    $EC2PublicDns = (aws cloudformation describe-stacks `
        --stack-name "$BackendStackName" `
        --region "$Region" `
        --query "Stacks[0].Outputs[?OutputKey=='DnsPublicoEC2'].OutputValue" `
        --output text 2>$null).Trim()
}

if ([string]::IsNullOrWhiteSpace($EC2PublicDns) -or $EC2PublicDns -eq "None") {
    Write-Error "Error: No se pudo obtener el DNS publico de EC2. Por favor proporciona el parametro -EC2PublicDns."
    exit 1
}

Write-Host "-> EC2 Public DNS: $EC2PublicDns" -ForegroundColor Green

# 2. Validar plantilla con cfn-lint si esta disponible
if (Get-Command cfn-lint -ErrorAction SilentlyContinue) {
    Write-Host "Validando plantilla con cfn-lint..." -ForegroundColor Yellow
    cfn-lint "$templateFile"
    Write-Host "-> Plantilla valida." -ForegroundColor Green
}

# 3. Desplegar con CloudFormation
Write-Host "Iniciando despliegue de CloudFormation..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file "$templateFile" `
    --stack-name "$StackName" `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides `
        EC2PublicDns="$EC2PublicDns" `
    --region "$Region"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Despliegue de frontend completado exitosamente!" -ForegroundColor Green
Write-Host " Salidas del Stack:" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
aws cloudformation describe-stacks `
    --stack-name "$StackName" `
    --region "$Region" `
    --query "Stacks[0].Outputs" `
    --output table
