#!/bin/bash

###############################################################################
# Script de Configuración SSL para AURONTEK
# Este script automatiza la instalación de Nginx, Certbot y la configuración SSL
###############################################################################

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root (usa sudo)"
    exit 1
fi

# Solicitar información al usuario
echo ""
print_info "=== Configuración SSL para AURONTEK ==="
echo ""

read -p "Ingresa tu dominio de No-IP (ej: aurontek.ddns.net): " DOMAIN
read -p "Ingresa la URL de tu frontend en Vercel (ej: https://aurontek.vercel.app): " VERCEL_URL
read -p "Ingresa tu email para notificaciones de Let's Encrypt: " EMAIL

# Validar que no estén vacíos
if [ -z "$DOMAIN" ] || [ -z "$VERCEL_URL" ] || [ -z "$EMAIL" ]; then
    print_error "Todos los campos son obligatorios"
    exit 1
fi

print_info "Configuración:"
echo "  - Dominio: $DOMAIN"
echo "  - Vercel URL: $VERCEL_URL"
echo "  - Email: $EMAIL"
echo ""
read -p "¿Es correcta esta información? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    print_warning "Configuración cancelada"
    exit 0
fi

# Detectar sistema operativo
print_info "Detectando sistema operativo..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    print_info "Sistema operativo detectado: $OS"
else
    print_error "No se pudo detectar el sistema operativo"
    exit 1
fi

# Actualizar paquetes
print_info "Actualizando lista de paquetes..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -qq
elif [ "$OS" = "amzn" ] || [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y -q
else
    print_warning "Sistema operativo no reconocido, intentando con apt-get..."
    apt-get update -qq || yum update -y -q
fi

# Instalar Nginx
print_info "Instalando Nginx..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y nginx
elif [ "$OS" = "amzn" ] || [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    amazon-linux-extras install -y nginx1 2>/dev/null || yum install -y nginx
else
    apt-get install -y nginx || yum install -y nginx
fi

# Instalar Certbot
print_info "Instalando Certbot..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y certbot python3-certbot-nginx
elif [ "$OS" = "amzn" ] || [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum install -y certbot python3-certbot-nginx
else
    apt-get install -y certbot python3-certbot-nginx || yum install -y certbot python3-certbot-nginx
fi

# Crear directorio para validación de Certbot
print_info "Creando directorio para validación de Certbot..."
mkdir -p /var/www/certbot

# Copiar y configurar archivo de Nginx
print_info "Configurando Nginx..."
NGINX_CONF="/etc/nginx/sites-available/aurontek"
NGINX_ENABLED="/etc/nginx/sites-enabled/aurontek"

# Buscar el archivo de configuración en el directorio actual
if [ -f "./nginx/aurontek.conf" ]; then
    cp ./nginx/aurontek.conf $NGINX_CONF
elif [ -f "./aurontek.conf" ]; then
    cp ./aurontek.conf $NGINX_CONF
else
    print_error "No se encontró el archivo de configuración de Nginx"
    print_info "Asegúrate de ejecutar este script desde el directorio raíz del proyecto"
    exit 1
fi

# Reemplazar variables en el archivo de configuración
print_info "Personalizando configuración..."
sed -i "s|YOUR_DOMAIN|$DOMAIN|g" $NGINX_CONF
sed -i "s|YOUR_VERCEL_URL|$VERCEL_URL|g" $NGINX_CONF

# Crear enlace simbólico
if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf $NGINX_CONF $NGINX_ENABLED
    print_info "Enlace simbólico creado en sites-enabled"
else
    # Para sistemas que no usan sites-enabled (como Amazon Linux)
    print_warning "El sistema no usa sites-enabled, incluyendo configuración en nginx.conf"
    if ! grep -q "include /etc/nginx/sites-available/aurontek;" /etc/nginx/nginx.conf; then
        sed -i '/http {/a \    include /etc/nginx/sites-available/aurontek;' /etc/nginx/nginx.conf
    fi
fi

# Deshabilitar configuración por defecto
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm -f /etc/nginx/sites-enabled/default
    print_info "Configuración por defecto deshabilitada"
fi

# Crear configuración temporal para validación de Certbot
print_info "Creando configuración temporal para validación..."
cat > /etc/nginx/sites-available/aurontek-temp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

ln -sf /etc/nginx/sites-available/aurontek-temp /etc/nginx/sites-enabled/aurontek-temp 2>/dev/null || true

# Verificar configuración de Nginx
print_info "Verificando configuración de Nginx..."
nginx -t

# Iniciar Nginx
print_info "Iniciando Nginx..."
systemctl enable nginx
systemctl restart nginx

# Verificar que Nginx está corriendo
if systemctl is-active --quiet nginx; then
    print_info "Nginx está corriendo correctamente"
else
    print_error "Nginx no se pudo iniciar"
    systemctl status nginx
    exit 1
fi

# Configurar firewall (si está activo)
print_info "Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full' 2>/dev/null || true
    print_info "Firewall UFW configurado"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    print_info "Firewall firewalld configurado"
fi

# Obtener certificado SSL
print_info "Obteniendo certificado SSL de Let's Encrypt..."
print_warning "Asegúrate de que tu dominio $DOMAIN apunte a esta IP pública"
read -p "Presiona Enter para continuar..."

certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    print_info "Certificado SSL obtenido exitosamente"
else
    print_error "Error al obtener el certificado SSL"
    print_info "Verifica que:"
    print_info "  1. Tu dominio $DOMAIN apunte a esta IP"
    print_info "  2. Los puertos 80 y 443 estén abiertos en el Security Group de AWS"
    print_info "  3. No haya otro servicio usando el puerto 80"
    exit 1
fi

# Activar configuración completa con SSL
print_info "Activando configuración completa con SSL..."
rm -f /etc/nginx/sites-enabled/aurontek-temp
ln -sf $NGINX_CONF $NGINX_ENABLED

# Verificar configuración nuevamente
nginx -t

# Recargar Nginx
systemctl reload nginx

# Configurar renovación automática
print_info "Configurando renovación automática de certificados..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Probar renovación (dry-run)
print_info "Probando renovación de certificado (dry-run)..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    print_info "Renovación automática configurada correctamente"
else
    print_warning "Hubo un problema con la configuración de renovación automática"
fi

# Resumen
echo ""
print_info "=== Configuración completada exitosamente ==="
echo ""
print_info "Tu sitio ahora está disponible en: https://$DOMAIN"
print_info "Certificado SSL válido hasta: $(certbot certificates | grep 'Expiry Date' | head -1)"
echo ""
print_info "Próximos pasos:"
echo "  1. Actualiza la variable VITE_API_URL en Vercel a: https://$DOMAIN/api"
echo "  2. Verifica que el gateway esté corriendo en el puerto 3000"
echo "  3. Prueba la conexión desde tu frontend en Vercel"
echo ""
print_info "Comandos útiles:"
echo "  - Ver estado de Nginx: sudo systemctl status nginx"
echo "  - Ver logs de Nginx: sudo tail -f /var/log/nginx/aurontek_error.log"
echo "  - Ver certificados: sudo certbot certificates"
echo "  - Renovar certificados manualmente: sudo certbot renew"
echo ""
