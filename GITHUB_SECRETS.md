# GitHub Secrets - Lista Completa para AURONTEK

> [!IMPORTANT]
> Esta es la lista completa de todos los secrets que debes configurar en GitHub para que el CI/CD funcione correctamente.

## 📍 Dónde Configurar

**GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

---

## 🔐 Secrets Requeridos

### 1. Docker Hub (Obligatorios)

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `DOCKER_USERNAME` | Tu usuario de Docker Hub | `ezelpc` | [hub.docker.com](https://hub.docker.com) |
| `DOCKER_PASSWORD` | Tu contraseña o token de Docker Hub | `dckr_pat_xxxxx` | Docker Hub → Account Settings → Security |

> [!TIP]
> **Recomendación**: Usa un Access Token en lugar de tu contraseña. Créalo en Docker Hub → Account Settings → Security → New Access Token.

---

### 2. AWS EC2 (Obligatorios)

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `EC2_HOST` | IP pública de tu instancia EC2 | `18.191.123.45` | AWS Console → EC2 → Instances |
| `EC2_USERNAME` | Usuario SSH (generalmente `ubuntu`) | `ubuntu` | Depende de tu AMI |
| `EC2_SSH_KEY` | Llave privada SSH completa (.pem) | `-----BEGIN RSA PRIVATE KEY-----\n...` | Tu archivo `.pem` descargado de AWS |

> [!CAUTION]
> **EC2_SSH_KEY**: Copia TODO el contenido de tu archivo `.pem`, incluyendo las líneas `-----BEGIN` y `-----END`.

---

### 3. MongoDB Atlas (Obligatorio)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `MONGODB_URI` | Connection string de MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/aurontek?retryWrites=true&w=majority` |

**Dónde obtenerlo:**
1. MongoDB Atlas → Clusters → Connect
2. Selecciona "Connect your application"
3. Copia el connection string
4. Reemplaza `<password>` con tu contraseña real
5. Reemplaza `<dbname>` con `aurontek`

---

### 4. CloudAMQP / RabbitMQ (Obligatorio)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `RABBITMQ_URL` | URL de conexión a RabbitMQ | `amqps://user:pass@rabbit.cloudamqp.com/vhost` |

**Dónde obtenerlo:**
- [CloudAMQP](https://www.cloudamqp.com/) → Dashboard → AMQP URL

---

### 5. Seguridad y Autenticación (Obligatorios)

| Secret | Descripción | Ejemplo | Cómo Generarlo |
|--------|-------------|---------|----------------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | `super-secret-key-change-this-in-production-12345` | Genera uno aleatorio de 64+ caracteres |
| `SERVICE_TOKEN` | Token para comunicación entre microservicios | `service-token-12345-abcdef` | Genera uno aleatorio de 32+ caracteres |

**Generar secrets seguros:**
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 6. Google reCAPTCHA (Obligatorio)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `RECAPTCHA_SECRET_KEY` | Secret key de reCAPTCHA v2 | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` |
| `RECAPTCHA_TEST_TOKEN` | Token de prueba (opcional) | `test-token-for-development` |

**Dónde obtenerlo:**
1. [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Crea un sitio con reCAPTCHA v2
3. Copia la "Secret Key"

> [!NOTE]
> También necesitarás la **Site Key** para el frontend (configurar en Vercel).

---

### 7. Cloudinary (Obligatorio - Para subida de imágenes)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Nombre de tu cloud | `aurontek-cloud` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `123456789012345` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `abcdefghijklmnopqrstuvwxyz123456` |

**Dónde obtenerlo:**
1. [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copia Cloud Name, API Key y API Secret

---

### 8. Email / SMTP (Obligatorio - Para notificaciones)

| Secret | Descripción | Ejemplo | Proveedor Recomendado |
|--------|-------------|---------|----------------------|
| `EMAIL_HOST` | Servidor SMTP | `smtp.gmail.com` | Gmail, SendGrid, Mailgun |
| `EMAIL_PORT` | Puerto SMTP | `587` | 587 (TLS) o 465 (SSL) |
| `EMAIL_USER` | Usuario/email SMTP | `notificaciones@aurontek.com` | Tu email |
| `EMAIL_PASSWORD` | Contraseña o App Password | `abcd efgh ijkl mnop` | App Password de Gmail |
| `EMAIL_SECURE` | Usar SSL/TLS | `true` | `true` para puerto 465, `false` para 587 |
| `EMAIL_FROM` | Email remitente | `"AURONTEK Soporte" <notificaciones@aurontek.com>` | Tu email |

**Para Gmail:**
1. Habilita verificación en 2 pasos
2. Genera una "App Password": [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Usa esa contraseña en `EMAIL_PASSWORD`

---

### 9. Redis (Opcional - Se usa Redis interno en Docker)

| Secret | Descripción | Ejemplo | Nota |
|--------|-------------|---------|------|
| `REDIS_URL` | URL de Redis externo | `redis://default:password@redis.example.com:6379` | Solo si usas Redis externo |

> [!NOTE]
> Por defecto, el `docker-compose.prod.yml` usa Redis interno. Solo configura esto si usas un Redis externo (ej: Redis Cloud).

---

### 10. Frontend y CORS (Obligatorios)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `FRONTEND_URL` | URL de tu frontend en Vercel | `https://aurontek.vercel.app` |
| `CUSTOM_DOMAIN` | Tu dominio No-IP con HTTPS | `https://aurontekhq-api.ddns.net` |

> [!WARNING]
> **NO incluyas `/` al final de las URLs**. Usa `https://aurontek.vercel.app` NO `https://aurontek.vercel.app/`

---

## 📋 Checklist de Configuración

Marca cada secret a medida que lo configures:

### Docker Hub
- [ ] `DOCKER_USERNAME`
- [ ] `DOCKER_PASSWORD`

### AWS EC2
- [ ] `EC2_HOST`
- [ ] `EC2_USERNAME`
- [ ] `EC2_SSH_KEY`

### Bases de Datos y Mensajería
- [ ] `MONGODB_URI`
- [ ] `RABBITMQ_URL`

### Seguridad
- [ ] `JWT_SECRET`
- [ ] `SERVICE_TOKEN`
- [ ] `RECAPTCHA_SECRET_KEY`
- [ ] `RECAPTCHA_TEST_TOKEN` (opcional)

### Servicios Externos
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

### Email
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `EMAIL_SECURE`
- [ ] `EMAIL_FROM`

### URLs y CORS
- [ ] `FRONTEND_URL`
- [ ] `CUSTOM_DOMAIN`

### Opcional
- [ ] `REDIS_URL` (solo si usas Redis externo)

---

## 🔍 Verificar Configuración

Después de configurar todos los secrets, verifica que estén correctos:

1. **GitHub Actions** → Ve a tu repositorio → Actions
2. Haz un push a `main` para activar el workflow
3. Revisa los logs del deployment
4. Si hay errores, verifica que los secrets estén bien configurados

---

## 🛠️ Comandos Útiles para Generar Secrets

```bash
# Generar JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar SERVICE_TOKEN (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ver contenido de tu llave SSH (para EC2_SSH_KEY)
cat ~/.ssh/aurontek-key.pem
# O en Windows:
type C:\Users\tu-usuario\.ssh\aurontek-key.pem
```

---

## ⚠️ Errores Comunes

### Error: "Invalid credentials" en Docker Hub
- **Causa**: `DOCKER_USERNAME` o `DOCKER_PASSWORD` incorrectos
- **Solución**: Verifica que el username sea exacto y usa un Access Token en lugar de contraseña

### Error: "Permission denied" en EC2
- **Causa**: `EC2_SSH_KEY` mal formateado
- **Solución**: Asegúrate de copiar TODO el contenido del `.pem`, incluyendo saltos de línea

### Error: "Connection refused" a MongoDB
- **Causa**: `MONGODB_URI` incorrecto o IP no whitelisteada
- **Solución**: 
  1. Verifica el connection string
  2. En MongoDB Atlas → Network Access → Whitelist `0.0.0.0/0` (o la IP de tu EC2)

### Error: "Invalid token" en JWT
- **Causa**: `JWT_SECRET` no configurado o diferente entre servicios
- **Solución**: Usa el mismo `JWT_SECRET` en todos los servicios

---

## 📚 Recursos Adicionales

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [MongoDB Atlas Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [Cloudinary Dashboard](https://cloudinary.com/console)

---

## 🎯 Resumen

**Total de Secrets Obligatorios**: 21  
**Total de Secrets Opcionales**: 2

Una vez configurados todos estos secrets, tu pipeline de CI/CD estará listo para:
1. ✅ Construir imágenes Docker
2. ✅ Pushear a Docker Hub
3. ✅ Desplegar automáticamente a EC2
4. ✅ Configurar todas las variables de entorno necesarias
