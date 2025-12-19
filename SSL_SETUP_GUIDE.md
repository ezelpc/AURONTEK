# Guía de Configuración SSL con No-IP y Certbot

Esta guía te ayudará a configurar SSL en tu servidor AWS EC2 usando un dominio de No-IP y Certbot (Let's Encrypt) para permitir comunicación segura HTTPS entre tu frontend en Vercel y tu backend en EC2.

## 📋 Requisitos Previos

> [!IMPORTANT]
> Este script **DEBE ejecutarse en el servidor EC2**, NO en tu máquina local.

> [!WARNING]
> Asegúrate de tener acceso SSH a tu instancia EC2 antes de continuar.

Antes de comenzar, verifica que tienes:

1. ✅ **Acceso SSH a tu EC2**
   ```bash
   # Prueba la conexión SSH
   ssh -i tu-llave.pem ubuntu@tu-ip-ec2
   ```

2. ✅ **Dominio de No-IP** configurado y apuntando a tu IP pública de EC2
   ```bash
   # Verifica que tu dominio apunta a tu EC2
   nslookup aurontekhq-api.ddns.net
   ```

3. ✅ **Puertos abiertos** en el Security Group de AWS:
   - Puerto 22 (SSH)
   - Puerto 80 (HTTP) - **Requerido para validación de Certbot**
   - Puerto 443 (HTTPS)

4. ✅ **Docker y Docker Compose** instalados en EC2

5. ✅ **Backend corriendo** en el puerto 3000 (Gateway)
   ```bash
   # Verifica desde el servidor EC2
   curl http://localhost:3000/health
   ```

## 🚀 Instalación Rápida (Recomendado)

> [!TIP]
> **Para producción sin clonar el repo completo**: Consulta [PRODUCTION_SSL_SETUP.md](./PRODUCTION_SSL_SETUP.md) para configurar SSL descargando solo los archivos necesarios (~10 KB vs ~50+ MB).

> [!CAUTION]
> Todos estos comandos deben ejecutarse **DENTRO del servidor EC2**, no en tu máquina local.

### Paso 1: Conectar a tu EC2 vía SSH

**Desde tu máquina local Windows**, abre PowerShell o Git Bash y conéctate:

```bash
# Reemplaza con tu información
ssh -i ruta/a/tu-llave.pem ubuntu@tu-ip-ec2

# Ejemplo:
# ssh -i C:/Users/tu-usuario/Downloads/aurontek-key.pem ubuntu@18.191.123.45
```

### Paso 2: Verificar o clonar el repositorio en EC2

**Ahora estás dentro del servidor EC2**. Verifica si el repositorio ya existe:

```bash
# Verificar si existe el directorio
ls -la AURONTEK

# Si NO existe, clónalo:
git clone https://github.com/tu-usuario/AURONTEK.git

# Entrar al directorio
cd AURONTEK
```

### Paso 3: Ejecutar el script de instalación SSL

**Dentro del directorio AURONTEK en EC2**:

```bash
# Dar permisos de ejecución al script
chmod +x scripts/setup-ssl.sh

# Ejecutar como root
sudo ./scripts/setup-ssl.sh
```

El script te pedirá:
- Tu dominio de No-IP (ej: `aurontek.ddns.net`)
- La URL de tu frontend en Vercel (ej: `https://aurontek.vercel.app`)
- Tu email para notificaciones de Let's Encrypt

### Paso 4: Configurar variables de entorno

Edita tu archivo `.env` en el servidor o configura las variables en GitHub Secrets:

```bash
# En el servidor EC2
nano .env
```

Agrega o actualiza:

```env
FRONTEND_URL=https://tu-app.vercel.app
CUSTOM_DOMAIN=https://tu-dominio.ddns.net
```

### Paso 5: Reiniciar los servicios

```bash
# Reconstruir y reiniciar el gateway
docker-compose -f docker-compose.prod.yml up -d --build gateway-svc
```

### Paso 6: Configurar Vercel

En tu proyecto de Vercel, actualiza la variable de entorno:

```
VITE_API_URL=https://tu-dominio.ddns.net/api
```

Luego redeploy tu frontend en Vercel.

## 🛠️ Instalación Manual

Si prefieres hacerlo paso a paso:

### 1. Instalar Nginx

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

**Amazon Linux:**
```bash
sudo yum update -y
sudo amazon-linux-extras install -y nginx1
```

### 2. Instalar Certbot

**Ubuntu/Debian:**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

**Amazon Linux:**
```bash
sudo yum install -y certbot python3-certbot-nginx
```

### 3. Configurar Nginx

```bash
# Copiar configuración
sudo cp nginx/aurontek.conf /etc/nginx/sites-available/aurontek

# Reemplazar variables (ajusta según tus valores)
sudo sed -i 's/YOUR_DOMAIN/tu-dominio.ddns.net/g' /etc/nginx/sites-available/aurontek
sudo sed -i 's|YOUR_VERCEL_URL|https://tu-app.vercel.app|g' /etc/nginx/sites-available/aurontek

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/aurontek /etc/nginx/sites-enabled/

# Deshabilitar sitio por defecto
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Obtener Certificado SSL

```bash
# Crear directorio para validación
sudo mkdir -p /var/www/certbot

# Obtener certificado
sudo certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email tu-email@ejemplo.com \
    -d tu-dominio.ddns.net
```

### 5. Configurar Renovación Automática

```bash
# Agregar tarea cron para renovación automática
(sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -

# Probar renovación (dry-run)
sudo certbot renew --dry-run
```

## 🔍 Verificación

### 1. Verificar que Nginx está corriendo

```bash
sudo systemctl status nginx
```

### 2. Verificar certificado SSL

```bash
sudo certbot certificates
```

Deberías ver algo como:

```
Certificate Name: tu-dominio.ddns.net
  Domains: tu-dominio.ddns.net
  Expiry Date: 2024-03-15 12:00:00+00:00 (VALID: 89 days)
```

### 3. Probar conexión HTTPS

```bash
curl -I https://tu-dominio.ddns.net/api/health
```

Deberías recibir una respuesta `200 OK`.

### 4. Verificar desde el navegador

Abre en tu navegador:
```
https://tu-dominio.ddns.net/api/health
```

Deberías ver el candado verde de SSL y una respuesta JSON.

## 🔧 Troubleshooting

### Problema: "No se encontró el archivo de configuración de Nginx"

**Causa:** Estás ejecutando el script en tu máquina local en lugar del servidor EC2.

**Solución:**
1. Conéctate a tu servidor EC2 vía SSH
2. Clona el repositorio en EC2 si no lo has hecho
3. Ejecuta el script desde el directorio raíz del proyecto en EC2

```bash
# Desde tu máquina local, conéctate a EC2
ssh -i tu-llave.pem ubuntu@tu-ip-ec2

# Dentro de EC2, clona y ejecuta
git clone https://github.com/tu-usuario/AURONTEK.git
cd AURONTEK
sudo ./scripts/setup-ssl.sh
```

### Problema: "Connection refused" al acceder a HTTPS

**Solución:**
1. Verifica que Nginx está corriendo: `sudo systemctl status nginx`
2. Verifica que el puerto 443 está abierto en el Security Group de AWS
3. Revisa los logs: `sudo tail -f /var/log/nginx/aurontek_error.log`

### Problema: "Certificate not found"

**Solución:**
1. Verifica que tu dominio apunta a la IP correcta: `nslookup tu-dominio.ddns.net`
2. Asegúrate de que el puerto 80 está abierto (Certbot lo necesita para validación)
3. Intenta obtener el certificado nuevamente: `sudo certbot certonly --nginx -d tu-dominio.ddns.net`

### Problema: CORS errors desde Vercel

**Solución:**
1. Verifica que `FRONTEND_URL` está configurado correctamente en el gateway
2. Revisa los logs del gateway: `docker logs -f gateway-svc`
3. Asegúrate de que la URL de Vercel incluye `https://` y no tiene `/` al final

### Problema: "502 Bad Gateway"

**Solución:**
1. Verifica que el gateway está corriendo: `docker ps | grep gateway`
2. Verifica que el gateway está en el puerto 3000: `curl http://localhost:3000/health`
3. Revisa los logs de Nginx: `sudo tail -f /var/log/nginx/aurontek_error.log`

## 📊 Monitoreo

### Ver logs de Nginx

```bash
# Logs de acceso
sudo tail -f /var/log/nginx/aurontek_access.log

# Logs de errores
sudo tail -f /var/log/nginx/aurontek_error.log
```

### Ver logs del Gateway

```bash
docker logs -f gateway-svc
```

### Verificar estado de todos los servicios

```bash
# Estado de Nginx
sudo systemctl status nginx

# Estado de contenedores Docker
docker ps

# Uso de recursos
docker stats
```

## 🔄 Renovación de Certificados

Los certificados de Let's Encrypt son válidos por 90 días. La renovación automática está configurada mediante cron.

### Verificar renovación automática

```bash
# Ver tareas cron
sudo crontab -l

# Probar renovación (no renueva realmente)
sudo certbot renew --dry-run
```

### Renovar manualmente

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## 🔐 Mejores Prácticas de Seguridad

1. **Limitar acceso SSH**: Solo permitir IPs confiables en el puerto 22
2. **Usar claves SSH**: Deshabilitar autenticación por contraseña
3. **Actualizar regularmente**: Mantener el sistema y paquetes actualizados
4. **Monitorear logs**: Revisar logs regularmente para detectar actividad sospechosa
5. **Backup de certificados**: Hacer backup de `/etc/letsencrypt/`

## 📝 Comandos Útiles

```bash
# Verificar configuración de Nginx
sudo nginx -t

# Recargar configuración de Nginx (sin downtime)
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver certificados instalados
sudo certbot certificates

# Revocar un certificado
sudo certbot revoke --cert-path /etc/letsencrypt/live/tu-dominio.ddns.net/cert.pem

# Eliminar un certificado
sudo certbot delete --cert-name tu-dominio.ddns.net
```

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de Nginx: `/var/log/nginx/aurontek_error.log`
2. Revisa los logs del Gateway: `docker logs gateway-svc`
3. Verifica la configuración de Nginx: `sudo nginx -t`
4. Consulta la documentación de Certbot: https://certbot.eff.org/

## 📚 Referencias

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [No-IP Documentation](https://www.noip.com/support)
