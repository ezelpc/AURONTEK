# Script para agregar GitHub Secrets faltantes
# Uso: .\add-github-secrets.ps1

$REPO = "ezelpc/AURONTEK"

Write-Host "Configurando GitHub Secrets para $REPO" -ForegroundColor Cyan
Write-Host ""

# Lista de secrets faltantes
$secrets = @(
    @{Name="CORE_PRIVATE_IP"; Description="IP privada de EC2 CORE (ej: 172.31.10.21)"}
    @{Name="CLOUDINARY_CLOUD_NAME"; Description="Nombre de cloud Cloudinary (ej: dxxxxxx)"}
    @{Name="CLOUDINARY_API_KEY"; Description="API Key de Cloudinary"}
    @{Name="CLOUDINARY_API_SECRET"; Description="API Secret de Cloudinary"}
    @{Name="RECAPTCHA_SECRET_KEY"; Description="reCAPTCHA Server Key (6Lc...)"}
    @{Name="RECAPTCHA_TEST_TOKEN"; Description="Token de prueba (ej: test_token)"}
    @{Name="RESEND_API_KEY"; Description="API Key de Resend (re_...)"}
    @{Name="RESEND_FROM_EMAIL"; Description="Email remitente (ej: noreply@aurontek.com)"}
)

Write-Host "Secrets a configurar:" -ForegroundColor Yellow
foreach ($secret in $secrets) {
    Write-Host "  - $($secret.Name)" -ForegroundColor White
}
Write-Host ""

$confirm = Read-Host "Deseas continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Cancelado" -ForegroundColor Red
    exit
}

Write-Host ""

# Agregar cada secret
foreach ($secret in $secrets) {
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "$($secret.Name)" -ForegroundColor Cyan
    Write-Host "   $($secret.Description)" -ForegroundColor Gray
    Write-Host ""
    
    # Ejecutar gh secret set
    gh secret set $secret.Name -R $REPO
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: $($secret.Name) configurado correctamente" -ForegroundColor Green
    } else {
        Write-Host "ERROR: al configurar $($secret.Name)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Listado de todos los secrets:" -ForegroundColor Cyan
gh secret list -R $REPO
