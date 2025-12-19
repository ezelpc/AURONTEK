# Guía Rápida: Configuración SSL en 5 Minutos

> [!IMPORTANT]
> Esta guía asume que ya tienes tu backend desplegado en EC2 y un dominio de No-IP configurado.

## ⚡ Pasos Rápidos

### 1️⃣ Conectar a EC2 (desde tu máquina local)

```bash
# Windows PowerShell o Git Bash
ssh -i C:/ruta/a/tu-llave.pem ubuntu@TU-IP-EC2

# Ejemplo:
# ssh -i C:/Users/ezequ/Downloads/aurontek.pem ubuntu@18.191.123.45
```

### 2️⃣ Clonar repositorio en EC2 (si no existe)

```bash
# Dentro de EC2
cd ~
git clone https://github.com/tu-usuario/AURONTEK.git
cd AURONTEK
```

### 3️⃣ Ejecutar script de SSL

```bash
# Dentro del directorio AURONTEK en EC2
chmod +x scripts/setup-ssl.sh
sudo ./scripts/setup-ssl.sh
```

El script te pedirá:
- **Dominio**: `aurontekhq-api.ddns.net`
- **URL Vercel**: `https://aurontek.vercel.app`
- **Email**: `ezequielpc496@gmail.com`

### 4️⃣ Actualizar Vercel

En tu proyecto de Vercel, actualiza la variable de entorno:

```
VITE_API_URL=https://aurontekhq-api.ddns.net/api
```

Luego haz redeploy del frontend.

---

## ✅ Verificación

Desde tu navegador, visita:
```
https://aurontekhq-api.ddns.net/api/health
```

Deberías ver:
- 🔒 Candado verde (SSL válido)
- ✅ Respuesta JSON del health check

---

## ❌ Errores Comunes

### "No se encontró el archivo de configuración"
- **Causa**: Ejecutaste el script en tu máquina local
- **Solución**: Conéctate a EC2 y ejecuta desde allí

### "Connection refused"
- **Causa**: Nginx no está corriendo o puerto 443 cerrado
- **Solución**: 
  ```bash
  sudo systemctl status nginx
  # Verifica Security Group en AWS
  ```

### "Certificate validation failed"
- **Causa**: Dominio no apunta a la IP correcta o puerto 80 cerrado
- **Solución**:
  ```bash
  nslookup aurontekhq-api.ddns.net
  # Debe mostrar tu IP de EC2
  ```

---

## 📚 Documentación Completa

Para más detalles, consulta: [SSL_SETUP_GUIDE.md](./SSL_SETUP_GUIDE.md)
