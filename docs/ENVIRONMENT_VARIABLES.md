# 🔐 Guía Completa de Variables de Entorno - AURONTEK

## 📋 Índice

1. [Resumen](#resumen)
2. [Variables por Servicio](#variables-por-servicio)
3. [GitHub Secrets](#github-secrets)
4. [Vercel (Frontend)](#vercel-frontend)
5. [Generación de Secrets](#generación-de-secrets)
6. [Validación](#validación)

---

## 1. 📖 Resumen

AURONTEK utiliza variables de entorno en **3 lugares diferentes**:

1. **GitHub Secrets** → CI/CD (deployment automático)
2. **EC2 .env files** → Backend (generados por CI/CD)
3. **Vercel** → Frontend

---

## 2. 🔧 Variables por Servicio

### 2.1 EDGE (EC2 Pública)

**Archivo:** `/opt/aurontek/.env`

```bash
# Docker
DOCKER_USERNAME=enpc29
IMAGE_TAG=latest

# Network
CORE_PRIVATE_IP=172.31.X.X          # IP privada de CORE

# Frontend
FRONTEND_URL=https://aurontek.vercel.app
CUSTOM_DOMAIN=https://aurontekhq-api.ddns.net

# Security
JWT_SECRET=<256-bit-secret>
SERVICE_TOKEN=<256-bit-secret>
RECAPTCHA_SECRET_KEY=<google-recaptcha-key>
RECAPTCHA_TEST_TOKEN=test_token
REDIS_PASSWORD=<192-bit-secret>
```

**Generado por:** CI/CD automáticamente

---

### 2.2 CORE (EC2 Privada)

**Archivo:** `/opt/aurontek/.env`

```bash
# Docker
DOCKER_USERNAME=enpc29
IMAGE_TAG=latest

# Network
EDGE_PRIVATE_IP=172.31.Y.Y          # IP privada de EDGE

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aurontek?retryWrites=true&w=majority

# Message Queue
RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost

# Security
JWT_SECRET=<256-bit-secret>
SERVICE_TOKEN=<256-bit-secret>
RECAPTCHA_SECRET_KEY=<google-recaptcha-key>
REDIS_PASSWORD=<192-bit-secret>

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@aurontek.com
```

**Generado por:** CI/CD automáticamente

---

## 3. 🔐 GitHub Secrets

### 3.1 Lista Completa

**Configurar en:** GitHub → Settings → Secrets → Actions

#### Infraestructura (6)
```
EDGE_HOST=54.123.45.67              # IP pública de EDGE
EDGE_PRIVATE_IP=172.31.10.20        # IP privada de EDGE
CORE_PRIVATE_IP=172.31.10.21        # IP privada de CORE
EC2_USERNAME=ubuntu
EC2_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----...
DOCKER_USERNAME=enpc29
DOCKER_PASSWORD=<docker-hub-password>
```

#### Bases de Datos (2)
```
MONGODB_URI=mongodb+srv://...
RABBITMQ_URL=amqps://...
```

#### Seguridad (4)
```
JWT_SECRET=<openssl rand -base64 32>
SERVICE_TOKEN=<openssl rand -base64 32>
REDIS_PASSWORD=<openssl rand -base64 24>
RECAPTCHA_SECRET_KEY=6Lc...
RECAPTCHA_TEST_TOKEN=test_token
```

#### Servicios Externos (5)
```
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@aurontek.com
```

#### Frontend (2)
```
FRONTEND_URL=https://aurontek.vercel.app
CUSTOM_DOMAIN=https://aurontekhq-api.ddns.net
```

**Total:** 21 secrets

---

### 3.2 Cómo Obtener Cada Secret

#### EDGE_HOST
```bash
# AWS Console → EC2 → Instances → AURONTEK-EDGE
# Copiar "Public IPv4 address"
54.123.45.67
```

#### EDGE_PRIVATE_IP / CORE_PRIVATE_IP
```bash
# AWS Console → EC2 → Instances → Seleccionar instancia
# Copiar "Private IPv4 address"
172.31.10.20
```

#### EC2_SSH_KEY
```bash
# En tu máquina local
cat aurontek-key.pem

# Copiar TODO el contenido (incluyendo BEGIN y END)
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

#### MONGODB_URI
```bash
# MongoDB Atlas → Clusters → Connect
# "Connect your application"
# Copiar connection string
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Reemplazar:
# - <username> con tu usuario
# - <password> con tu password
# - <database> con "aurontek"
```

#### RABBITMQ_URL
```bash
# CloudAMQP → Instance Details
# Copiar "AMQP URL"
amqps://username:password@host.cloudamqp.com/vhost
```

#### JWT_SECRET / SERVICE_TOKEN
```bash
# Generar con OpenSSL
openssl rand -base64 32

# Output ejemplo:
8xK9mP2nQ5rS7tU1vW3xY4zA6bC8dE0fG2hI4jK6lM8=
```

#### REDIS_PASSWORD
```bash
# Generar con OpenSSL
openssl rand -base64 24

# Output ejemplo:
7yH9kL3mN5pR8sT2uV4wX6zA9bD1eF3g
```

#### RECAPTCHA_SECRET_KEY
```bash
# Google reCAPTCHA Admin
# https://www.google.com/recaptcha/admin
# Crear nuevo site (v2 Checkbox)
# Copiar "Secret Key"
6Lc...
```

#### CLOUDINARY_*
```bash
# Cloudinary Dashboard
# https://cloudinary.com/console
# Copiar:
# - Cloud Name
# - API Key
# - API Secret
```

#### RESEND_*
```bash
# Resend Dashboard
# https://resend.com/api-keys
# Create API Key
# Copiar API Key

# Email debe estar verificado en Resend
```

#### FRONTEND_URL
```bash
# Vercel Dashboard
# Copiar URL de deployment
https://aurontek.vercel.app
```

#### CUSTOM_DOMAIN
```bash
# No-IP Dashboard
# Copiar hostname configurado
https://aurontekhq-api.ddns.net
```

---

## 4. 🌐 Vercel (Frontend)

### 4.1 Variables Requeridas

**Configurar en:** Vercel → Project → Settings → Environment Variables

```bash
# Backend API
VITE_API_URL=https://aurontekhq-api.ddns.net

# reCAPTCHA (Site Key - PÚBLICO)
VITE_RECAPTCHA_SITE_KEY=6Lc...

# Environment
VITE_NODE_ENV=production
```

### 4.2 Cómo Configurar

1. Vercel Dashboard → Seleccionar proyecto
2. Settings → Environment Variables
3. Add New:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://aurontekhq-api.ddns.net`
   - **Environment:** Production, Preview, Development
4. Repetir para cada variable
5. Redeploy para aplicar cambios

---

## 5. 🔑 Generación de Secrets

### 5.1 Secrets Seguros

```bash
# JWT_SECRET (256 bits)
openssl rand -base64 32

# SERVICE_TOKEN (256 bits)
openssl rand -base64 32

# REDIS_PASSWORD (192 bits)
openssl rand -base64 24

# Password genérico (128 bits)
openssl rand -base64 16
```

### 5.2 Requisitos de Seguridad

| Secret | Longitud Mínima | Caracteres |
|--------|-----------------|------------|
| JWT_SECRET | 32 bytes | Base64 |
| SERVICE_TOKEN | 32 bytes | Base64 |
| REDIS_PASSWORD | 24 bytes | Base64 |
| Passwords | 12 caracteres | Alfanumérico + símbolos |

---

## 6. ✅ Validación

### 6.1 Verificar GitHub Secrets

```bash
# En GitHub Actions, ver logs de deployment
# Si falta un secret, aparecerá error:
# "Error: Secret MONGODB_URI not found"
```

### 6.2 Verificar .env en EC2

```bash
# EDGE
ssh ubuntu@EDGE_IP
cat /opt/aurontek/.env

# Verificar que todas las variables estén presentes
# NO debe haber valores vacíos o "undefined"

# CORE (desde EDGE)
ssh ubuntu@CORE_PRIVATE_IP
cat /opt/aurontek/.env
```

### 6.3 Verificar Servicios

```bash
# EDGE
curl http://localhost:3000/health
# Debe retornar: {"status":"ok"}

# CORE
curl http://CORE_PRIVATE_IP:3001/health  # usuarios
curl http://CORE_PRIVATE_IP:3002/health  # tickets
# Todos deben retornar 200 OK
```

---

## 7. 🔄 Rotación de Secrets

### 7.1 Cuándo Rotar

- ✅ Cada 90 días (recomendado)
- ✅ Después de que un empleado deje el equipo
- ✅ Si sospechas de compromiso
- ✅ Después de un incidente de seguridad

### 7.2 Proceso de Rotación

```bash
# 1. Generar nuevo secret
openssl rand -base64 32

# 2. Actualizar en GitHub Secrets
# Settings → Secrets → Edit secret

# 3. Actualizar en servicios externos si aplica
# (MongoDB, Cloudinary, Resend, etc.)

# 4. Trigger nuevo deployment
git commit --allow-empty -m "chore: Rotar secrets"
git push origin main

# 5. Verificar que todo funcione
curl https://aurontekhq-api.ddns.net/health
```

---

## 8. 🚨 Seguridad

### 8.1 ⚠️ NUNCA:

- ❌ Commitear secrets en el código
- ❌ Compartir secrets por email/Slack
- ❌ Usar secrets de producción en desarrollo
- ❌ Reutilizar passwords entre servicios
- ❌ Hardcodear secrets en el código

### 8.2 ✅ SIEMPRE:

- ✅ Usar GitHub Secrets para CI/CD
- ✅ Generar secrets con `openssl rand`
- ✅ Rotar secrets cada 90 días
- ✅ Usar secrets diferentes para dev/prod
- ✅ Monitorear accesos sospechosos

---

## 9. 📊 Checklist de Configuración

### Inicial (Una sola vez)

- [ ] Crear cuenta AWS
- [ ] Crear instancias EC2 (EDGE + CORE)
- [ ] Crear cuenta MongoDB Atlas
- [ ] Crear cuenta CloudAMQP
- [ ] Crear cuenta Cloudinary
- [ ] Crear cuenta Resend
- [ ] Crear cuenta No-IP
- [ ] Generar todos los secrets
- [ ] Configurar GitHub Secrets (21 secrets)
- [ ] Configurar Vercel Environment Variables (3 vars)

### Por Deployment

- [ ] Verificar GitHub Secrets actualizados
- [ ] Push a main
- [ ] Verificar CI/CD exitoso
- [ ] Verificar health checks
- [ ] Probar login desde frontend
- [ ] Verificar CORS
- [ ] Verificar rate limiting

---

## 📚 Referencias

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Connection Strings](https://www.mongodb.com/docs/atlas/driver-connection/)
- [OpenSSL Random](https://www.openssl.org/docs/man1.1.1/man1/rand.html)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
