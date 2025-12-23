# Configuración SSL en Producción (Sin Clonar Repositorio)

> [!TIP]
> Esta guía es para configurar SSL en EC2 **sin necesidad de clonar todo el repositorio**, optimizando el espacio en disco.

## 📋 Método 1: Usar Script Mejorado (Recomendado)

El script `setup-ssl.sh` ahora descarga automáticamente la configuración de Nginx desde GitHub si no la encuentra localmente.

### Pasos:

1. **Conectar a EC2**:
   ```bash
   ssh -i tu-llave.pem ubuntu@tu-ip-ec2
   ```

2. **Descargar solo el script SSL**:
   ```bash
   # Crear directorio para scripts
   mkdir -p ~/aurontek-scripts
   cd ~/aurontek-scripts
   
   # Descargar el script de SSL
   curl -fsSL https://raw.githubusercontent.com/ezelpc/AURONTEK/main/scripts/setup-ssl.sh -o setup-ssl.sh
   
   # Dar permisos de ejecución
   chmod +x setup-ssl.sh
   ```

3. **Ejecutar el script**:
   ```bash
   sudo ./setup-ssl.sh
   ```

El script automáticamente:
- ✅ Descargará la configuración de Nginx desde GitHub
- ✅ Instalará Nginx y Certbot
- ✅ Configurará SSL con Let's Encrypt
- ✅ Configurará renovación automática

---

## 📋 Método 2: Descarga Manual de Archivos

Si prefieres descargar los archivos manualmente:

### 1. Conectar a EC2:
```bash
ssh -i tu-llave.pem ubuntu@tu-ip-ec2
```

### 2. Descargar archivos necesarios:
```bash
# Crear directorio temporal
mkdir -p ~/ssl-setup
cd ~/ssl-setup

# Descargar configuración de Nginx
curl -fsSL https://raw.githubusercontent.com/ezelpc/AURONTEK/main/nginx/aurontek.conf -o aurontek.conf

# Descargar script de setup
curl -fsSL https://raw.githubusercontent.com/ezelpc/AURONTEK/main/scripts/setup-ssl.sh -o setup-ssl.sh

# Dar permisos
chmod +x setup-ssl.sh
```

### 3. Ejecutar setup:
```bash
sudo ./setup-ssl.sh
```

---

## 📋 Método 3: Configuración Manual Completa

Si prefieres hacerlo completamente manual sin scripts:

### 1. Instalar dependencias:
```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 2. Descargar y configurar Nginx:
```bash
# Descargar configuración
sudo curl -fsSL https://raw.githubusercontent.com/ezelpc/AURONTEK/main/nginx/aurontek.conf \
  -o /etc/nginx/sites-available/aurontek

# Reemplazar variables
sudo sed -i 's/YOUR_DOMAIN/aurontekhq-api.ddns.net/g' /etc/nginx/sites-available/aurontek
sudo sed -i 's|YOUR_VERCEL_URL|https://aurontek.vercel.app|g' /etc/nginx/sites-available/aurontek

# Crear enlace simbólico
sudo ln -sf /etc/nginx/sites-available/aurontek /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar y reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Obtener certificado SSL:
```bash
sudo mkdir -p /var/www/certbot

sudo certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email ezequielpc496@gmail.com \
    -d aurontekhq-api.ddns.net
```

### 4. Configurar renovación automática:
```bash
(sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
```

---

## 🔍 Verificación

```bash
# Verificar Nginx
sudo systemctl status nginx

# Verificar certificado
sudo certbot certificates

# Probar endpoint
curl -I https://aurontekhq-api.ddns.net/api/health
```

---

## 📊 Comparación de Métodos

| Método | Espacio en Disco | Complejidad | Actualizaciones |
|--------|------------------|-------------|-----------------|
| **Método 1** (Script auto-descarga) | ~10 KB | ⭐ Baja | Automáticas |
| **Método 2** (Descarga manual) | ~15 KB | ⭐⭐ Media | Manuales |
| **Método 3** (Todo manual) | ~5 KB | ⭐⭐⭐ Alta | Manuales |
| Clonar repo completo | ~50+ MB | ⭐ Baja | Git pull |

> [!IMPORTANT]
> **Recomendación**: Usa el **Método 1** para mayor simplicidad y actualizaciones automáticas del archivo de configuración.

---

## 🔄 Actualizar Configuración

Si necesitas actualizar la configuración de Nginx en el futuro:

```bash
# Descargar nueva versión
sudo curl -fsSL https://raw.githubusercontent.com/ezelpc/AURONTEK/main/nginx/aurontek.conf \
  -o /etc/nginx/sites-available/aurontek

# Actualizar variables
sudo sed -i 's/YOUR_DOMAIN/aurontekhq-api.ddns.net/g' /etc/nginx/sites-available/aurontek
sudo sed -i 's|YOUR_VERCEL_URL|https://aurontek.vercel.app|g' /etc/nginx/sites-available/aurontek

# Verificar y recargar
sudo nginx -t
sudo systemctl reload nginx
```

---

## 💡 Ventajas de No Clonar el Repo

✅ **Ahorro de espacio**: Solo ~10-15 KB vs ~50+ MB del repo completo  
✅ **Más rápido**: Descarga instantánea vs clonar todo el repo  
✅ **Más seguro**: No expones código fuente en producción  
✅ **Más limpio**: Solo archivos necesarios para SSL  

---

## 📚 Referencias

- [SSL_SETUP_GUIDE.md](./SSL_SETUP_GUIDE.md) - Guía completa con repo clonado
- [QUICK_SSL_SETUP.md](./QUICK_SSL_SETUP.md) - Guía rápida
- [scripts/setup-ssl.sh](./scripts/setup-ssl.sh) - Script de instalación
