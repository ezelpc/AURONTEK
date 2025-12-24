# Script para configurar TODOS los GitHub Secrets
# Uso: Edita los valores abajo y ejecuta: .\configure-all-secrets.ps1

$REPO = "ezelpc/AURONTEK"

Write-Host "Configurando GitHub Secrets para $REPO" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# EDITA ESTOS VALORES CON TUS DATOS REALES
# ============================================================================

# Infraestructura AWS
$EDGE_HOST = "3.238.124.15"                    # IP publica de EC2 EDGE (Actualizar si cambia)
$EDGE_PRIVATE_IP = "172.31.76.255"              # IP privada de EC2 EDGE (Actualizar si cambia)
$CORE_PRIVATE_IP = "172.31.78.64"              # IP privada de EC2 CORE (Actualizar si cambia)
$EC2_USERNAME = "ubuntu"                        # Usuario SSH (por defecto ubuntu)

# Docker Hub
$DOCKER_USERNAME = "enpc29"                     # Tu usuario de Docker Hub
$DOCKER_PASSWORD = "TU_TOKEN_DOCKER_HUB"        # Password de Docker Hub

# Bases de Datos
$MONGODB_URI = "mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/DBNAME"  # MongoDB Atlas connection string
$RABBITMQ_URL = "amqps://USER:PASSWORD@CLUSTER.cloudamqp.com/VHOST"     # CloudAMQP URL

# Seguridad (genera con: openssl rand -base64 32)
$JWT_SECRET = "GENERAR_NUEVO_SECRET_CON_OPENSSL"          # Secret para JWT
$SERVICE_TOKEN = "GENERAR_NUEVO_TOKEN_SEGURO"    # Token inter-servicios
$REDIS_PASSWORD = "GENERAR_PASSWORD_SEGURO"           # Password de Redis

# reCAPTCHA
$RECAPTCHA_SECRET_KEY = "TU_CLAVE_SECRETA_RECAPTCHA"  # Google reCAPTCHA Server Key
$RECAPTCHA_TEST_TOKEN = "test_tok_TOKEN_PRUEBA"            # Token de prueba

# Cloudinary
$CLOUDINARY_CLOUD_NAME = "TU_CLOUD_NAME"              # Nombre de cloud Cloudinary
$CLOUDINARY_API_KEY = "TU_API_KEY"         # API Key de Cloudinary
$CLOUDINARY_API_SECRET = "TU_API_SECRET" # API Secret de Cloudinary

# Resend (Email)
$RESEND_API_KEY = "re_TU_API_KEY"            # API Key de Resend
$RESEND_FROM_EMAIL = "noreply@aurontek.com"     # Email remitente

# Frontend
$FRONTEND_URL = "https://aurontek.vercel.app"   # URL del frontend en Vercel
$CUSTOM_DOMAIN = "https://aurontekhq-api.ddns.net"  # Dominio No-IP
$AURONTEK_HQ_EDIT_CODE = "CODIGO_DE_EDICION"
# SSH Key (leer desde archivo .pem)
# IMPORTANTE: Reemplaza con la ruta a tu archivo .pem
$SSH_KEY_PATH = "C:/Ruta/a/tu/llave.pem"

# ============================================================================
# NO EDITES DEBAJO DE ESTA LINEA
# ============================================================================

Write-Host "Verificando valores..." -ForegroundColor Yellow

# Verificar que SSH key existe
if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "ERROR: No se encuentra el archivo SSH key en: $SSH_KEY_PATH" -ForegroundColor Red
    Write-Host "Por favor, edita la variable SSH_KEY_PATH con la ruta correcta" -ForegroundColor Yellow
    exit 1
}

Write-Host "Leyendo SSH key desde: $SSH_KEY_PATH" -ForegroundColor Green
$EC2_SSH_KEY = Get-Content $SSH_KEY_PATH -Raw

Write-Host ""
Write-Host "Configurando secrets en GitHub..." -ForegroundColor Cyan
Write-Host ""

# Funcion para agregar secret
function Add-GitHubSecret {
    param($Name, $Value)
    
    Write-Host "  Configurando: $Name" -ForegroundColor White
    echo $Value | gh secret set $Name -R $REPO 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    OK" -ForegroundColor Green
    } else {
        Write-Host "    ERROR" -ForegroundColor Red
    }
}

# Agregar todos los secrets
Add-GitHubSecret "EDGE_HOST" $EDGE_HOST
Add-GitHubSecret "EDGE_PRIVATE_IP" $EDGE_PRIVATE_IP
Add-GitHubSecret "CORE_PRIVATE_IP" $CORE_PRIVATE_IP
Add-GitHubSecret "EC2_USERNAME" $EC2_USERNAME
Add-GitHubSecret "EC2_SSH_KEY" $EC2_SSH_KEY

Add-GitHubSecret "DOCKER_USERNAME" $DOCKER_USERNAME
Add-GitHubSecret "DOCKER_PASSWORD" $DOCKER_PASSWORD

Add-GitHubSecret "MONGODB_URI" $MONGODB_URI
Add-GitHubSecret "RABBITMQ_URL" $RABBITMQ_URL

Add-GitHubSecret "JWT_SECRET" $JWT_SECRET
Add-GitHubSecret "SERVICE_TOKEN" $SERVICE_TOKEN
Add-GitHubSecret "REDIS_PASSWORD" $REDIS_PASSWORD
Add-GitHubSecret "RECAPTCHA_SECRET_KEY" $RECAPTCHA_SECRET_KEY
Add-GitHubSecret "RECAPTCHA_TEST_TOKEN" $RECAPTCHA_TEST_TOKEN

Add-GitHubSecret "CLOUDINARY_CLOUD_NAME" $CLOUDINARY_CLOUD_NAME
Add-GitHubSecret "CLOUDINARY_API_KEY" $CLOUDINARY_API_KEY
Add-GitHubSecret "CLOUDINARY_API_SECRET" $CLOUDINARY_API_SECRET

Add-GitHubSecret "RESEND_API_KEY" $RESEND_API_KEY
Add-GitHubSecret "RESEND_FROM_EMAIL" $RESEND_FROM_EMAIL

Add-GitHubSecret "FRONTEND_URL" $FRONTEND_URL
Add-GitHubSecret "CUSTOM_DOMAIN" $CUSTOM_DOMAIN
Add-GitHubSecret "AURONTEK_HQ_EDIT_CODE" $AURONTEK_HQ_EDIT_CODE

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
Write-Host ""
Write-Host "Ahora puedes hacer push a main para activar el CI/CD" -ForegroundColor Yellow
