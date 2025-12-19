# 🔐 Configuración SSL con No-IP - Guía Rápida

Esta guía te ayudará a configurar SSL en tu servidor EC2 usando un dominio de No-IP para permitir comunicación segura entre Vercel y tu backend.

## 📋 Requisitos Previos

- ✅ Dominio de No-IP apuntando a tu IP pública de EC2
- ✅ Acceso SSH a EC2
- ✅ Puertos 80 y 443 abiertos en Security Group de AWS
- ✅ Backend corriendo en puerto 3000

## 🚀 Instalación en 3 Pasos

### 1️⃣ En tu servidor EC2

```bash
# Conectar a EC2
ssh -i tu-llave.pem ubuntu@tu-ip-ec2

# Ir al directorio del proyecto
cd AURONTEK

# Ejecutar script de instalación SSL
chmod +x scripts/setup-ssl.sh
sudo ./scripts/setup-ssl.sh
```

El script te pedirá:
- Tu dominio de No-IP (ej: `aurontek.ddns.net`)
- URL de Vercel (ej: `https://aurontek.vercel.app`)
- Email para Let's Encrypt

### 2️⃣ Configurar variables de entorno en EC2

```bash
# Editar archivo .env
nano .env
```

Agregar:
```env
FRONTEND_URL=https://tu-app.vercel.app
CUSTOM_DOMAIN=https://tu-dominio.ddns.net
```

Reiniciar gateway:
```bash
docker-compose -f docker-compose.prod.yml up -d --build gateway-svc
```

### 3️⃣ Configurar Vercel

En tu proyecto de Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Agrega:
   ```
   VITE_API_URL=https://tu-dominio.ddns.net/api
   VITE_WS_URL=https://tu-dominio.ddns.net
   ```
3. Redeploy tu aplicación

## ✅ Verificación

```bash
# Verificar que Nginx está corriendo
sudo systemctl status nginx

# Verificar certificado SSL
sudo certbot certificates

# Probar endpoint
curl -I https://tu-dominio.ddns.net/api/health
```

## 📚 Documentación Completa

Para más detalles, troubleshooting y configuración avanzada, consulta:
- [SSL_SETUP_GUIDE.md](./SSL_SETUP_GUIDE.md) - Guía completa de SSL
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guía de despliegue

## 🆘 Problemas Comunes

**Error: Connection refused**
- Verifica que Nginx está corriendo: `sudo systemctl status nginx`
- Verifica puertos 80/443 en Security Group de AWS

**Error: Certificate not found**
- Verifica que tu dominio apunta a la IP correcta: `nslookup tu-dominio.ddns.net`
- Asegúrate de que el puerto 80 está abierto

**Error: CORS desde Vercel**
- Verifica `FRONTEND_URL` en el gateway
- Revisa logs: `docker logs -f gateway-svc`

## 📞 Comandos Útiles

```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/aurontek_error.log

# Ver logs del Gateway
docker logs -f gateway-svc

# Renovar certificado manualmente
sudo certbot renew
sudo systemctl reload nginx
```
