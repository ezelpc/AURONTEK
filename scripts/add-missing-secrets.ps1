# Script para agregar variables de entorno faltantes a GitHub Secrets
# Uso: .\add-missing-secrets.ps1

$REPO = "ezelpc/AURONTEK"

Write-Host "Agregando variables de entorno faltantes a GitHub Secrets" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# EDITA ESTOS VALORES CON TUS DATOS REALES
# ============================================================================

# URLs de Servicios (para comunicación entre microservicios)
$USUARIOS_SVC_URL = "http://localhost:3001"
$TICKETS_SVC_URL = "http://localhost:3002"
$CHAT_SERVICE_URL = "http://localhost:3003"
$NOTIFICATIONS_SERVICE_URL = "http://localhost:3004"
$IA_SERVICE_URL = "http://localhost:3005"
$GATEWAY_URL = "http://localhost:3000"

# OpenAI (para IA service)
$OPENAI_API_KEY = "sk-TU_API_KEY_OPENAI"

# ============================================================================
# NO EDITES DEBAJO DE ESTA LINEA
# ============================================================================

Write-Host "Verificando gh CLI..." -ForegroundColor Yellow

# Verificar que gh CLI esté instalado
try {
    gh --version | Out-Null
} catch {
    Write-Host "ERROR: gh CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala desde: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host "gh CLI encontrado ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Configurando secrets en GitHub..." -ForegroundColor Cyan
Write-Host ""

# Funcion para agregar secret
function Add-GitHubSecret {
    param($Name, $Value)
    
    Write-Host "  Configurando: $Name" -ForegroundColor White
    echo $Value | gh secret set $Name -R $REPO 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ OK" -ForegroundColor Green
    } else {
        Write-Host "    ✗ ERROR" -ForegroundColor Red
    }
}

# Agregar secrets faltantes
Add-GitHubSecret "USUARIOS_SVC_URL" $USUARIOS_SVC_URL
Add-GitHubSecret "TICKETS_SVC_URL" $TICKETS_SVC_URL
Add-GitHubSecret "CHAT_SERVICE_URL" $CHAT_SERVICE_URL
Add-GitHubSecret "NOTIFICATIONS_SERVICE_URL" $NOTIFICATIONS_SERVICE_URL
Add-GitHubSecret "IA_SERVICE_URL" $IA_SERVICE_URL
Add-GitHubSecret "GATEWAY_URL" $GATEWAY_URL
Add-GitHubSecret "OPENAI_API_KEY" $OPENAI_API_KEY

Write-Host ""
Write-Host "========================================" -ForegroundColor Gray
Write-Host "Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Listado de secrets configurados:" -ForegroundColor Cyan
gh secret list -R $REPO
Write-Host ""
Write-Host "Total de secrets: " -NoNewline
$secretCount = (gh secret list -R $REPO | Measure-Object -Line).Lines - 1
Write-Host "$secretCount" -ForegroundColor Green
