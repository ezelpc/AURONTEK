#!/bin/bash

###############################################################################
# Script de Configuración de Variables de Entorno para Vercel
# Este script genera un archivo .env.production para el frontend
###############################################################################

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo ""
print_info "=== Configuración de Variables de Entorno para Vercel ==="
echo ""

# Solicitar información
read -p "Ingresa tu dominio con HTTPS (ej: https://aurontek.ddns.net): " CUSTOM_DOMAIN

# Validar que no esté vacío
if [ -z "$CUSTOM_DOMAIN" ]; then
    print_warning "El dominio no puede estar vacío"
    exit 1
fi

# Crear archivo .env.production
ENV_FILE="./frontend/.env.production"

print_info "Creando archivo $ENV_FILE..."

cat > $ENV_FILE << EOF
# Configuración de Producción para Frontend
# Este archivo debe ser configurado en Vercel como variables de entorno

# URL del API (tu dominio personalizado con SSL)
VITE_API_URL=${CUSTOM_DOMAIN}/api

# URL del WebSocket para chat en tiempo real
VITE_WS_URL=${CUSTOM_DOMAIN}

# reCAPTCHA Site Key (obtener de Google reCAPTCHA)
VITE_RECAPTCHA_SITE_KEY=tu-recaptcha-site-key

# Modo de producción
NODE_ENV=production
EOF

print_info "Archivo creado exitosamente: $ENV_FILE"
echo ""
print_info "Contenido del archivo:"
cat $ENV_FILE
echo ""
print_warning "Próximos pasos:"
echo "  1. Obtén tu reCAPTCHA Site Key de: https://www.google.com/recaptcha/admin"
echo "  2. Reemplaza 'tu-recaptcha-site-key' en el archivo $ENV_FILE"
echo "  3. En Vercel, ve a: Settings > Environment Variables"
echo "  4. Agrega las siguientes variables:"
echo ""
echo "     VITE_API_URL=${CUSTOM_DOMAIN}/api"
echo "     VITE_WS_URL=${CUSTOM_DOMAIN}"
echo "     VITE_RECAPTCHA_SITE_KEY=tu-recaptcha-site-key"
echo "     NODE_ENV=production"
echo ""
echo "  5. Redeploy tu aplicación en Vercel"
echo ""
