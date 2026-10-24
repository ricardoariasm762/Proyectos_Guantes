# ==============================================================================
# Script de Ejecución Automatizada para Suite de API REST (Nivel 2)
# Proyecto de Grado - Universidad Cooperativa de Colombia (Campus Pasto)
# ==============================================================================

$baseUrl = "http://localhost:8080"
$evidenceDir = "c:\Proyecto_grado\docs\testing\evidencias\api"
if (!(Test-Path $evidenceDir)) { New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null }

# Limpieza previa en Base de Datos para asegurar idempotencia total
$env:PGPASSWORD = "1234"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d guantes_db -c "
DELETE FROM modelos_ia WHERE version = 'v1.1-2026-11';
DELETE FROM usuarios WHERE email = 'prueba_api@ucc.edu.co';
" | Out-Null

Write-Host "Iniciando Suite de Pruebas de API REST (API-01 a API-15)..." -ForegroundColor Cyan

function Invoke-ApiTest {
    param(
        [string]$TestId,
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers,
        [string]$Body,
        [int[]]$ExpectedStatus
    )

    $url = "$baseUrl$Path"
    $reqHeaders = @{}
    if ($Headers) { $reqHeaders = $Headers }

    $evidenceFile = Join-Path $evidenceDir "$TestId-$($Name.Replace(' ', '-').ToLower()).txt"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $log = @"
==============================================================================
CASO DE PRUEBA: $TestId - $Name
FECHA: $timestamp
MÉTODO: $Method $url
HEADERS: $(if ($Headers) { ($Headers | ConvertTo-Json -Compress) } else { "Ninguno" })
PAYLOAD: $(if ($Body) { $Body } else { "Vacío" })
==============================================================================

"@

    try {
        $params = @{
            Uri = $url
            Method = $Method
        }
        if ($Body) {
            $params["Body"] = $Body
            $params["ContentType"] = "application/json; charset=utf-8"
        }
        if ($Headers) {
            $params["Headers"] = $Headers
        }

        $response = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $statusCode = [int]$response.StatusCode
        $responseBody = $response.Content

        $log += "STATUS RECIBIDO: $statusCode`nRESPUESTA:`n$responseBody`n"

        $passed = $ExpectedStatus -contains $statusCode
        if ($passed) {
            $log += "`nVEREDICTO: EXITOSO (Status $statusCode esperado)`n"
            Write-Host "[$TestId] PASS - $Name (Status: $statusCode)" -ForegroundColor Green
        } else {
            $log += "`nVEREDICTO: FALLIDO (Status $statusCode, esperado: $($ExpectedStatus -join ','))`n"
            Write-Host "[$TestId] FAIL - $Name (Status: $statusCode, esperado: $($ExpectedStatus -join ','))" -ForegroundColor Red
        }

        $log | Out-File -FilePath $evidenceFile -Encoding utf8
        return @{
            TestId = $TestId
            Status = $statusCode
            Body = $responseBody
            Passed = $passed
        }
    }
    catch {
        $statusCode = 0
        $responseBody = ""
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
            }
        } else {
            $responseBody = $_.Exception.Message
        }

        $log += "STATUS RECIBIDO: $statusCode`nRESPUESTA/ERROR:`n$responseBody`n"

        $passed = $ExpectedStatus -contains $statusCode
        if ($passed) {
            $log += "`nVEREDICTO: EXITOSO (Status $statusCode esperado)`n"
            Write-Host "[$TestId] PASS - $Name (Status: $statusCode)" -ForegroundColor Green
        } else {
            $log += "`nVEREDICTO: FALLIDO (Status $statusCode, esperado: $($ExpectedStatus -join ','))`n"
            Write-Host "[$TestId] FAIL - $Name (Status: $statusCode, esperado: $($ExpectedStatus -join ','))" -ForegroundColor Red
        }

        $log | Out-File -FilePath $evidenceFile -Encoding utf8
        return @{
            TestId = $TestId
            Status = $statusCode
            Body = $responseBody
            Passed = $passed
        }
    }
}

# ------------------------------------------------------------------------------
# 1. AUTH: API-01 (Registro de Usuario)
# ------------------------------------------------------------------------------
# Limpieza previa del usuario de prueba si existiera
$studentEmail = "prueba_api@ucc.edu.co"
$registerPayload = @"
{
  "nombre": "Estudiante",
  "apellido": "Prueba",
  "email": "$studentEmail",
  "password": "prueba123456",
  "rol": "ESTUDIANTE"
}
"@
$res01 = Invoke-ApiTest -TestId "API-01" -Name "Registro de Usuario" -Method "Post" -Path "/api/auth/register" -Body $registerPayload -ExpectedStatus @(201)

# Extraer Token del estudiante
$tokenEstudiante = ""
if ($res01.Body) {
    try {
        $json = $res01.Body | ConvertFrom-Json
        $tokenEstudiante = $json.token
    } catch {}
}

# ------------------------------------------------------------------------------
# 2. AUTH: API-02 (Registro con Email Duplicado)
# ------------------------------------------------------------------------------
$res02 = Invoke-ApiTest -TestId "API-02" -Name "Registro Duplicado" -Method "Post" -Path "/api/auth/register" -Body $registerPayload -ExpectedStatus @(400)

# ------------------------------------------------------------------------------
# 3. AUTH: API-03 (Login Exitoso)
# ------------------------------------------------------------------------------
$loginPayload = @"
{
  "email": "$studentEmail",
  "password": "prueba123456"
}
"@
$res03 = Invoke-ApiTest -TestId "API-03" -Name "Login Exitoso" -Method "Post" -Path "/api/auth/login" -Body $loginPayload -ExpectedStatus @(200)
if ($res03.Body -and -not $tokenEstudiante) {
    try {
        $json = $res03.Body | ConvertFrom-Json
        $tokenEstudiante = $json.token
    } catch {}
}

# ------------------------------------------------------------------------------
# 4. AUTH: API-04 (Login con Credenciales Inválidas)
# ------------------------------------------------------------------------------
$loginBadPayload = @"
{
  "email": "$studentEmail",
  "password": "password_incorrecto"
}
"@
$res04 = Invoke-ApiTest -TestId "API-04" -Name "Login Invalido" -Method "Post" -Path "/api/auth/login" -Body $loginBadPayload -ExpectedStatus @(400, 401)

# ------------------------------------------------------------------------------
# OBTENER TOKEN DE ADMINISTRADOR (admin@ucc.edu.co / admin123456)
# ------------------------------------------------------------------------------
$adminLoginPayload = @"
{
  "email": "admin@ucc.edu.co",
  "password": "admin123456"
}
"@
$adminRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $adminLoginPayload
$tokenAdmin = $adminRes.token

# Headers autorizados
$headersStudent = @{ "Authorization" = "Bearer $tokenEstudiante" }
$headersAdmin = @{ "Authorization" = "Bearer $tokenAdmin" }

# ------------------------------------------------------------------------------
# 5. INTENTOS: API-05 (Guardar intento sin metadatos de IA)
# ------------------------------------------------------------------------------
$intentoLegacyPayload = @"
{
  "modoPractica": "GUIADO",
  "puntaje": 850.0,
  "duracionSegundos": 225,
  "completado": true,
  "observaciones": "Intento legacy sin telemetria IA",
  "pasos": [
    {
      "numeroPaso": 1,
      "nombrePaso": "Verificar integridad del empaque",
      "descripcion": "Revisar fecha y esterilidad",
      "exitoso": true,
      "tiempoSegundos": 30
    }
  ]
}
"@
$res05 = Invoke-ApiTest -TestId "API-05" -Name "Guardar Intento Sin IA" -Method "Post" -Path "/api/intentos" -Headers $headersStudent -Body $intentoLegacyPayload -ExpectedStatus @(201)

# ------------------------------------------------------------------------------
# 6. INTENTOS: API-06 (Guardar intento con telemetría de IA)
# ------------------------------------------------------------------------------
$detalleJson = '{\"pasos\":[{\"numero\":1,\"correcto\":true,\"confianza\":0.92,\"fuente\":\"CONSENSO\"},{\"numero\":2,\"correcto\":true,\"confianza\":0.88,\"fuente\":\"IA\"}],\"confianzaPromedio\":0.89,\"fuenteDominante\":\"CONSENSO\",\"versionModelo\":\"v1.0-2026-10\"}'
$intentoIAPayload = @"
{
  "modoPractica": "EVALUACION",
  "puntaje": 920.0,
  "duracionSegundos": 180,
  "completado": true,
  "confianzaPromedio": 0.89,
  "fuentePrediccion": "CONSENSO",
  "versionModelo": "v1.0-2026-10",
  "detalleIA": "$detalleJson",
  "pasos": [
    {
      "numeroPaso": 1,
      "nombrePaso": "Inspeccion de empaque",
      "exitoso": true,
      "tiempoSegundos": 25,
      "precision": 0.92
    },
    {
      "numeroPaso": 2,
      "nombrePaso": "Apertura en superficie esteril",
      "exitoso": true,
      "tiempoSegundos": 35,
      "precision": 0.88
    }
  ]
}
"@
$res06 = Invoke-ApiTest -TestId "API-06" -Name "Guardar Intento Con Metadatos IA" -Method "Post" -Path "/api/intentos" -Headers $headersStudent -Body $intentoIAPayload -ExpectedStatus @(201)

$intentoCreadoId = 1
if ($res06.Body) {
    try {
        $json = $res06.Body | ConvertFrom-Json
        $intentoCreadoId = $json.id
    } catch {}
}

# ------------------------------------------------------------------------------
# 7. INTENTOS: API-07 (Validación de Confianza Fuera de Rango > 1.0)
# ------------------------------------------------------------------------------
$intentoBadConfPayload = @"
{
  "modoPractica": "EVALUACION",
  "puntaje": 500.0,
  "duracionSegundos": 300,
  "confianzaPromedio": 1.50
}
"@
$res07 = Invoke-ApiTest -TestId "API-07" -Name "Validacion Confianza Fuera Rango" -Method "Post" -Path "/api/intentos" -Headers $headersStudent -Body $intentoBadConfPayload -ExpectedStatus @(400)

# ------------------------------------------------------------------------------
# 8. INTENTOS: API-08 (Listar Mis Intentos)
# ------------------------------------------------------------------------------
$res08 = Invoke-ApiTest -TestId "API-08" -Name "Listar Mis Intentos" -Method "Get" -Path "/api/intentos/mis-intentos" -Headers $headersStudent -ExpectedStatus @(200)

# ------------------------------------------------------------------------------
# 9. PROGRESO: API-09 (Consultar Mi Progreso)
# ------------------------------------------------------------------------------
$res09 = Invoke-ApiTest -TestId "API-09" -Name "Consultar Mi Progreso" -Method "Get" -Path "/api/progreso/mi-progreso" -Headers $headersStudent -ExpectedStatus @(200)

# ------------------------------------------------------------------------------
# 10. INTENTOS: API-10 (Intento de Eliminación de Intento)
# ------------------------------------------------------------------------------
$res10 = Invoke-ApiTest -TestId "API-10" -Name "Eliminar Intento" -Method "Delete" -Path "/api/intentos/$intentoCreadoId" -Headers $headersStudent -ExpectedStatus @(204, 405)

# ------------------------------------------------------------------------------
# 11. MODELOS IA: API-11 (Registrar Versión IA - ADMIN)
# ------------------------------------------------------------------------------
$modeloPayload = @"
{
  "version": "v1.1-2026-11",
  "accuracy": 0.91,
  "numClases": 9,
  "numMuestras": 3200,
  "descripcion": "Modelo reentrenado con aumento de datos clinicos",
  "activo": true
}
"@
$res11 = Invoke-ApiTest -TestId "API-11" -Name "Registrar Version IA Admin" -Method "Post" -Path "/api/ia/version" -Headers $headersAdmin -Body $modeloPayload -ExpectedStatus @(201)

# ------------------------------------------------------------------------------
# 12. MODELOS IA: API-12 (Estudiante Intenta Registrar Versión IA -> 403 Forbidden)
# ------------------------------------------------------------------------------
$res12 = Invoke-ApiTest -TestId "API-12" -Name "Estudiante Registra Version IA" -Method "Post" -Path "/api/ia/version" -Headers $headersStudent -Body $modeloPayload -ExpectedStatus @(403)

# ------------------------------------------------------------------------------
# 13. MODELOS IA: API-13 (Obtener Versión Activa del Modelo)
# ------------------------------------------------------------------------------
$res13 = Invoke-ApiTest -TestId "API-13" -Name "Obtener Version Activa IA" -Method "Get" -Path "/api/ia/version/activa" -Headers $headersStudent -ExpectedStatus @(200)

# ------------------------------------------------------------------------------
# 14. SEGURIDAD: API-14 (Acceso a Endpoint Protegido Sin Token -> 401 o 403)
# ------------------------------------------------------------------------------
$res14 = Invoke-ApiTest -TestId "API-14" -Name "Acceso Sin Token" -Method "Get" -Path "/api/intentos/mis-intentos" -ExpectedStatus @(401, 403)

# ------------------------------------------------------------------------------
# 15. SEGURIDAD: API-15 (Acceso con Token Corrupto/Inválido -> 401 o 403)
# ------------------------------------------------------------------------------
$badHeaders = @{ "Authorization" = "Bearer token_falsificado_invalido_123" }
$res15 = Invoke-ApiTest -TestId "API-15" -Name "Acceso Con Token Invalido" -Method "Get" -Path "/api/intentos/mis-intentos" -Headers $badHeaders -ExpectedStatus @(401, 403)

Write-Host "`nSuite de API REST Finalizada. Resultados registrados en $evidenceDir" -ForegroundColor Cyan
