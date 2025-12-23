# 🔐 GitHub Secrets - AURONTEK

## 📋 Lista Completa de Secrets

### 🌐 Infraestructura

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `EDGE_HOST` | IP pública de EC2 EDGE | `54.123.45.67` | AWS Console → EC2 → EDGE Instance |
| `EDGE_PRIVATE_IP` | IP privada de EC2 EDGE | `172.31.10.20` | AWS Console → EC2 → EDGE Instance |
| `CORE_PRIVATE_IP` | IP privada de EC2 CORE | `172.31.10.21` | AWS Console → EC2 → CORE Instance |
| `EC2_USERNAME` | Usuario SSH | `ubuntu` | Por defecto en Ubuntu AMI |
| `EC2_SSH_KEY` | Llave privada SSH completa | `-----BEGIN RSA PRIVATE KEY-----\n...` | Archivo .pem descargado de AWS |

### 🐳 Docker

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `DOCKER_USERNAME` | Usuario de Docker Hub | `enpc29` | https://hub.docker.com |
| `DOCKER_PASSWORD` | Password de Docker Hub | `********` | https://hub.docker.com/settings/security |

### 🗄️ Bases de Datos

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `MONGODB_URI` | Connection string de MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/db` | MongoDB Atlas → Connect |
| `RABBITMQ_URL` | Connection string de RabbitMQ | `amqps://user:pass@host.cloudamqp.com/vhost` | CloudAMQP → Details |

### 🔒 Seguridad

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `JWT_SECRET` | Secret para JWT | `tu_secreto_super_seguro_256_bits` | Generar con `openssl rand -base64 32` |
| `SERVICE_TOKEN` | Token inter-servicios | `otro_token_seguro_256_bits` | Generar con `openssl rand -base64 32` |
| `REDIS_PASSWORD` | Password de Redis | `redis_password_seguro` | Generar con `openssl rand -base64 24` |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA Server Key | `6Lc...` | Google reCAPTCHA Admin |
| `RECAPTCHA_TEST_TOKEN` | Token de prueba | `test_token` | Cualquier string para testing |

### ☁️ Servicios Externos

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `CLOUDINARY_CLOUD_NAME` | Nombre de cloud Cloudinary | `dxxxxxx` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `123456789012345` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `abcdefghijklmnopqrstuvwxyz` | Cloudinary Dashboard → API Keys |
| `RESEND_API_KEY` | API Key de Resend | `re_...` | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | Email remitente | `noreply@aurontek.com` | Email verificado en Resend |

### 🌍 Frontend

| Secret | Descripción | Ejemplo | Dónde Obtenerlo |
|--------|-------------|---------|-----------------|
| `FRONTEND_URL` | URL del frontend | `https://aurontek.vercel.app` | Vercel Dashboard |
| `CUSTOM_DOMAIN` | Dominio personalizado | `https://aurontekhq-api.ddns.net` | No-IP Dashboard |

---

## 🛠️ Cómo Configurar

### 1. Acceder a GitHub Secrets

```
1. Ve a tu repositorio en GitHub
2. Click en "Settings"
3. En el menú lateral, click en "Secrets and variables" → "Actions"
4. Click en "New repository secret"
```

### 2. Agregar Cada Secret

Para cada secret de la tabla:
1. **Name:** Nombre exacto del secret (ej: `EDGE_HOST`)
2. **Value:** Valor del secret
3. Click en "Add secret"

### 3. Secrets Especiales

#### EC2_SSH_KEY

**Formato correcto:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(múltiples líneas)
...
-----END RSA PRIVATE KEY-----
```

**Cómo obtenerlo:**
```bash
# En tu máquina local
cat tu-llave.pem

# Copiar TODO el contenido (incluyendo BEGIN y END)
# Pegar en GitHub Secret
```

#### MONGODB_URI

**Formato:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Dónde obtenerlo:**
1. MongoDB Atlas → Clusters
2. Click en "Connect"
3. "Connect your application"
4. Copiar connection string
5. Reemplazar `<password>` y `<database>`

#### RABBITMQ_URL

**Formato:**
```
amqps://username:password@host.cloudamqp.com/vhost
```

**Dónde obtenerlo:**
1. CloudAMQP → Instance Details
2. Copiar "AMQP URL"

---

## 🔐 Generar Secrets Seguros

### JWT_SECRET y SERVICE_TOKEN

```bash
# Generar secret de 256 bits
openssl rand -base64 32

# Ejemplo de output:
# 8xK9mP2nQ5rS7tU1vW3xY4zA6bC8dE0fG2hI4jK6lM8=
```

### REDIS_PASSWORD

```bash
# Generar password de 192 bits
openssl rand -base64 24

# Ejemplo de output:
# 7yH9kL3mN5pR8sT2uV4wX6zA9bD1eF3g
```

---

## ✅ Verificación

### Verificar que Todos los Secrets Estén Configurados

```bash
# En GitHub Actions, verifica que el workflow no falle por secrets faltantes
# Los secrets faltantes aparecerán como errores en el log
```

### Secrets Requeridos por Servicio

#### EDGE (.env)
```bash
DOCKER_USERNAME
IMAGE_TAG
CORE_PRIVATE_IP
FRONTEND_URL
CUSTOM_DOMAIN
JWT_SECRET
SERVICE_TOKEN
RECAPTCHA_SECRET_KEY
RECAPTCHA_TEST_TOKEN
REDIS_PASSWORD
```

#### CORE (.env)
```bash
DOCKER_USERNAME
IMAGE_TAG
EDGE_PRIVATE_IP
MONGODB_URI
RABBITMQ_URL
JWT_SECRET
SERVICE_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RECAPTCHA_SECRET_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
REDIS_PASSWORD
```

---

## 🚨 Seguridad

### ⚠️ NUNCA:
- ❌ Commitear secrets en el código
- ❌ Compartir secrets en Slack/Email
- ❌ Usar secrets de producción en desarrollo
- ❌ Reutilizar passwords entre servicios

### ✅ SIEMPRE:
- ✅ Usar GitHub Secrets para CI/CD
- ✅ Rotar secrets cada 90 días
- ✅ Usar secrets diferentes para dev/prod
- ✅ Generar secrets con `openssl rand`

---

## 🔄 Rotación de Secrets

### Cuándo Rotar

- ✅ Cada 90 días (recomendado)
- ✅ Después de que un empleado deje el equipo
- ✅ Si sospechas de compromiso
- ✅ Después de un incidente de seguridad

### Cómo Rotar

1. **Generar nuevo secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Actualizar en GitHub Secrets**
   - Settings → Secrets → Edit secret

3. **Actualizar en servicios externos**
   - MongoDB, Cloudinary, Resend, etc.

4. **Trigger nuevo deploy**
   ```bash
   git commit --allow-empty -m "chore: Rotar secrets"
   git push origin main
   ```

5. **Verificar que todo funcione**
   - Probar login
   - Probar upload de imágenes
   - Probar envío de emails

---

## 📚 Referencias

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS EC2 Key Pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [MongoDB Atlas Connection Strings](https://www.mongodb.com/docs/atlas/driver-connection/)
- [OpenSSL Random](https://www.openssl.org/docs/man1.1.1/man1/rand.html)
