# 🚀 Guía Completa de Despliegue - AURONTEK CI/CD

Esta guía te llevará paso a paso desde cero hasta tener tu aplicación desplegada en producción con un pipeline automatizado.

---

## 📋 Tabla de Contenidos

1. [Resumen del Flujo de Trabajo](#resumen-del-flujo-de-trabajo)
2. [Parte 1: Configuración de Servicios Externos](#parte-1-configuración-de-servicios-externos)
3. [Parte 2: Configuración de AWS EC2](#parte-2-configuración-de-aws-ec2)
4. [Parte 3: Configuración de GitHub](#parte-3-configuración-de-github)
5. [Parte 4: Flujo de Desarrollo y Despliegue](#parte-4-flujo-de-desarrollo-y-despliegue)
6. [Parte 5: Monitoreo y Troubleshooting](#parte-5-monitoreo-y-troubleshooting)

---

## Resumen del Flujo de Trabajo

### Estrategia Multi-Branch

```mermaid
graph LR
    A[dev Branch] -->|Push| B[GitHub Actions CI]
    B -->|Build Only| C[✅ Verifica que compila]
    
    D[test Branch] -->|Push| E[GitHub Actions CI]
    E -->|Build Only| F[✅ Verifica que compila]
    
    G[test] -->|Merge| H[main Branch]
    H -->|Push| I[GitHub Actions CI + CD]
    I -->|Build + Deploy| J[🚀 Producción EC2]
```

### ¿Cómo funciona?

- **Branch `dev`**: Desarrollo activo → Solo ejecuta CI (construcción de imágenes)
- **Branch `test`**: Pruebas → Solo ejecuta CI (construcción de imágenes)
- **Branch `main`**: Producción → Ejecuta CI + CD (construcción + despliegue automático a EC2)

**Cuando haces un pull request de `test` a `main` y lo mergeas, automáticamente se despliega a producción.**

---

## Parte 1: Configuración de Servicios Externos

### 1.1 MongoDB Atlas (Base de Datos en la Nube)

**Por qué:** Evitar correr MongoDB en EC2 ahorra ~400MB de RAM.

#### Pasos:

1. **Crear cuenta gratuita:**
   - Ve a [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
   - Regístrate con tu correo

2. **Crear un cluster gratuito (M0):**
   - Click en "Build a Database"
   - Selecciona **M0 (Free)**
   - Elige región: **AWS / us-east-1** (misma región que EC2 para menor latencia)
   - Nombre del cluster: `aurontek-cluster`
   - Click "Create"

3. **Configurar acceso:**
   - **Database Access** → "Add New Database User"
     - Username: `aurontek_admin`
     - Password: (genera una contraseña segura, guárdala)
     - Database User Privileges: **Read and write to any database**
   
   - **Network Access** → "Add IP Address"
     - Click "Allow Access from Anywhere" (0.0.0.0/0)
     - Confirm

4. **Obtener Connection String:**
   - Click en "Connect" en tu cluster
   - Selecciona "Connect your application"
   - Driver: **Node.js**
   - Copia el connection string:
     ```
     mongodb+srv://aurontek_admin:<password>@aurontek-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Reemplaza `<password>` con tu contraseña
   - Agrega el nombre de la base de datos al final:
     ```
     mongodb+srv://aurontek_admin:TU_PASSWORD@aurontek-cluster.xxxxx.mongodb.net/aurontek?retryWrites=true&w=majority
     ```

**✅ Guarda este connection string, lo necesitarás para GitHub Secrets.**

---

### 1.2 CloudAMQP (RabbitMQ en la Nube)

**Por qué:** Evitar correr RabbitMQ en EC2 ahorra ~150MB de RAM.

#### Pasos:

1. **Crear cuenta gratuita:**
   - Ve a [https://www.cloudamqp.com/](https://www.cloudamqp.com/)
   - Sign up gratis

2. **Crear instancia:**
   - Click "Create New Instance"
   - Name: `aurontek-rabbitmq`
   - Plan: **Lemur (Free)**
   - Region: **AWS / US-East-1** (misma que EC2)
   - Click "Create instance"

3. **Obtener URL de conexión:**
   - Click en tu instancia
   - En la pestaña "Details", copia el **AMQP URL**:
     ```
     amqps://username:password@beaver.rmq.cloudamqp.com/username
     ```

**✅ Guarda esta URL, la necesitarás para GitHub Secrets.**

---

### 1.3 Docker Hub (Registro de Imágenes)

**Por qué:** Para almacenar las imágenes Docker y desplegarlas en EC2.

#### Pasos:

1. **Crear cuenta:**
   - Ve a [https://hub.docker.com/signup](https://hub.docker.com/signup)
   - Regístrate

2. **Crear Access Token:**
   - Ve a Account Settings → Security → "New Access Token"
   - Description: `github-actions`
   - Permissions: **Read, Write, Delete**
   - Copy token (solo lo verás una vez)

**✅ Guarda tu username y token:**
- `DOCKER_USERNAME`: tu username de Docker Hub
- `DOCKER_PASSWORD`: el token que acabas de generar

---

### 1.4 Vercel (Frontend Hosting)

**Por qué:** Hosting gratuito con CDN global, SSL automático, y deploys por branch.

#### Pasos:

1. **Crear cuenta:**
   - Ve a [https://vercel.com/signup](https://vercel.com/signup)
   - Regístrate con GitHub

2. **Importar proyecto:**
   - Click "Add New..." → "Project"
   - Selecciona tu repositorio `AURONTEK`
   - Framework Preset: **Create React App**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Configurar variables de entorno:**
   - En "Environment Variables", agrega:
     ```
     REACT_APP_API_URL = http://TU_EC2_IP:3000
     ```
   - **Importante:** Cambia `TU_EC2_IP` después de crear tu EC2

4. **Deploy automático:**
   - Vercel automáticamente despliega:
     - `dev` → Preview deployment
     - `test` → Preview deployment
     - `main` → Production deployment

**✅ Anota tu URL de producción de Vercel.**

---

## Parte 2: Configuración de AWS EC2

### 2.1 Lanzar Instancia EC2

1. **Ir a AWS Console:**
   - Inicia sesión en [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
   - Busca "EC2" en la barra de búsqueda

2. **Launch Instance:**
   - Click "Launch Instance"
   - **Name:** `aurontek-backend`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type:** `t2.micro` (1 vCPU, 1GB RAM - Free tier)
   - **Key pair:**
     - Click "Create new key pair"
     - Name: `aurontek-key`
     - Type: RSA
     - Format: `.pem` (para SSH desde Windows con OpenSSH/Git Bash)
     - **Descarga y guarda este archivo en un lugar seguro**

3. **Network Settings:**
   - Click "Edit"
   - **Auto-assign public IP:** Enable
   - **Security Group:** Create new
     - Name: `aurontek-sg`
     - Description: `Security group for AURONTEK backend`
   
   - **Inbound Rules:**
     - SSH (22) → Source: My IP (tu IP actual)
     - Custom TCP (3000) → Source: Anywhere (0.0.0.0/0) - API Gateway
     - HTTP (80) → Source: Anywhere (0.0.0.0/0) - Opcional para Nginx
     - HTTPS (443) → Source: Anywhere (0.0.0.0/0) - Opcional para SSL

4. **Storage:**
   - 8 GB gp3 (Free tier permite hasta 30GB)
   - Cambia a 30GB si necesitas más espacio

5. **Launch Instance**
   - Click "Launch instance"
   - Espera a que el estado sea "Running"

6. **Obtener IP pública:**
   - Selecciona tu instancia
   - Copia el **Public IPv4 address** (ejemplo: `3.123.45.67`)

**✅ Guarda:**
- La clave privada `aurontek-key.pem`
- La IP pública de tu EC2

---

### 2.2 Conectar y Configurar EC2

#### Conectar vía SSH:

**En Windows (PowerShell o Git Bash):**

```bash
# Dar permisos a la clave (solo primera vez)
icacls aurontek-key.pem /inheritance:r
icacls aurontek-key.pem /grant:r "%username%:R"

# Conectar
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP
```

**En Linux/Mac:**

```bash
# Dar permisos a la clave (solo primera vez)
chmod 400 aurontek-key.pem

# Conectar
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP
```

#### Ejecutar script de setup:

Una vez conectado a EC2:

```bash
# Descargar el script de setup
curl -o setup_ec2.sh https://raw.githubusercontent.com/TU_USUARIO/AURONTEK/main/scripts/setup_ec2.sh

# Dar permisos de ejecución
chmod +x setup_ec2.sh

# Ejecutar
./setup_ec2.sh
```

**Este script instala:**
- Docker y Docker Compose
- 4GB de memoria swap (crítico para t2.micro)
- Herramientas de monitoreo (htop)

#### Cerrar sesión y volver a conectar:

```bash
# Salir
exit

# Volver a conectar para que los cambios de grupo de Docker tomen efecto
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP
```

#### Crear archivos de configuración:

```bash
# Crear directorio de aplicación
cd /opt/aurontek

# Descargar docker-compose.prod.yml
curl -o docker-compose.prod.yml https://raw.githubusercontent.com/TU_USUARIO/AURONTEK/main/docker-compose.prod.yml

# Crear archivo .env (NO lo subas a GitHub)
nano .env
```

En el editor nano, pega (se creará automáticamente en el deploy, pero puedes hacerlo manual):

```bash
DOCKER_USERNAME=tu-dockerhub-username
IMAGE_TAG=latest
MONGODB_URI=mongodb+srv://aurontek_admin:PASSWORD@cluster.mongodb.net/aurontek
RABBITMQ_URL=amqps://user:pass@beaver.rmq.cloudamqp.com/user
JWT_SECRET=tu-secret-super-secreto-cambialo
# ... resto de variables
```

Guardar: `Ctrl + O`, Enter, `Ctrl + X`

**✅ EC2 está listo. El deploy se hará automáticamente desde GitHub Actions.**

---

## Parte 3: Configuración de GitHub

### 3.1 Crear Branches

En tu repositorio local:

```bash
# Crear branch dev
git checkout -b dev
git push -u origin dev

# Crear branch test
git checkout -b test
git push -u origin test

# Volver a main
git checkout main
```

---

### 3.2 Configurar GitHub Secrets

Los secretos son credenciales que GitHub Actions usa para desplegar.

1. **Ir a tu repositorio en GitHub:**
   - Settings → Secrets and variables → Actions → "New repository secret"

2. **Agregar los siguientes secretos:**

| Secret Name | Valor | Descripción |
|-------------|-------|-------------|
| `DOCKER_USERNAME` | tu-docker-username | Tu username de Docker Hub |
| `DOCKER_PASSWORD` | tu-docker-token | El access token de Docker Hub |
| `EC2_HOST` | 3.123.45.67 | IP pública de tu EC2 |
| `EC2_USERNAME` | ubuntu | Usuario de EC2 (siempre `ubuntu` para Ubuntu AMI) |
| `EC2_SSH_KEY` | (contenido de aurontek-key.pem) | Copia TODO el contenido del archivo .pem |
| `MONGODB_URI` | mongodb+srv://... | Connection string de MongoDB Atlas |
| `RABBITMQ_URL` | amqps://... | URL de CloudAMQP |
| `JWT_SECRET` | un-string-aleatorio-muy-largo | Para firmar tokens JWT |
| `RECAPTCHA_SECRET_KEY` | tu-recaptcha-secret | De Google reCAPTCHA |
| `RECAPTCHA_TEST_TOKEN` | test-token | Token de prueba |
| `CLOUDINARY_CLOUD_NAME` | tu-cloud-name | De Cloudinary |
| `CLOUDINARY_API_KEY` | tu-api-key | De Cloudinary |
| `CLOUDINARY_API_SECRET` | tu-api-secret | De Cloudinary |
| `EMAIL_HOST` | smtp.gmail.com | Servidor SMTP |
| `EMAIL_PORT` | 587 | Puerto SMTP |
| `EMAIL_USER` | tu-email@gmail.com | Email para enviar notificaciones |
| `EMAIL_PASSWORD` | tu-app-password | Contraseña de aplicación de Gmail |
| `EMAIL_SECURE` | false | SSL (false para puerto 587) |
| `EMAIL_FROM` | AURONTEK <noreply@aurontek.com> | Remitente de emails |

**Cómo copiar la SSH Key:**

En Windows PowerShell:
```powershell
Get-Content aurontek-key.pem | clip
```

En Linux/Mac:
```bash
cat aurontek-key.pem | pbcopy  # Mac
cat aurontek-key.pem | xclip -selection clipboard  # Linux
```

Pega el contenido completo (incluyendo `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`) en el secret `EC2_SSH_KEY`.

**✅ Todos los secretos configurados.**

---

### 3.3 Protección de Branches (Opcional pero Recomendado)

1. **Settings → Branches → "Add branch protection rule"**

2. **Para `main`:**
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - Status checks: `Build & Test`

3. **Para `test`:**
   - Branch name pattern: `test`
   - ✅ Require status checks to pass before merging
   - Status checks: `Build & Test`

Esto asegura que solo código que pase CI puede mergearse.

---

## Parte 4: Flujo de Desarrollo y Despliegue

### 4.1 Desarrollo en `dev`

```bash
# Asegúrate de estar en dev
git checkout dev

# Haz tus cambios
# ... edita archivos ...

# Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin dev
```

**¿Qué pasa?**
- ✅ GitHub Actions ejecuta el job **CI** (construye todas las imágenes)
- ⏭️ **NO** se despliega a producción
- ✅ Vercel crea un **Preview Deployment** en `https://aurontek-dev-xxx.vercel.app`

**Ver resultados:**
- GitHub: Actions tab → Ver el workflow corriendo
- Vercel: Dashboard → Ver el preview deployment

---

### 4.2 Pruebas en `test`

```bash
# Cambiar a test
git checkout test

# Merge desde dev
git merge dev

# Push
git push origin test
```

**¿Qué pasa?**
- ✅ GitHub Actions ejecuta el job **CI** (construye todas las imágenes)
- ⏭️ **NO** se despliega a producción
- ✅ Vercel crea un **Preview Deployment** en `https://aurontek-test-xxx.vercel.app`

---

### 4.3 Despliegue a Producción (`main`)

**¡AQUÍ ES DONDE LA MAGIA SUCEDE!**

```bash
# Cambiar a main
git checkout main

# Merge desde test (ESTO DESPLIEGA A PRODUCCIÓN)
git merge test

# Push
git push origin main
```

**¿Qué pasa?**
- ✅ GitHub Actions ejecuta el job **CI** (construye todas las imágenes)
- ✅ GitHub Actions ejecuta el job **Deploy**:
  1. Sube las 6 imágenes a Docker Hub
  2. Se conecta a EC2 vía SSH
  3. Descarga las imágenes desde Docker Hub
  4. Reinicia todos los servicios
  5. Limpia imágenes antiguas
- ✅ Vercel despliega el frontend a **producción** en tu dominio

**Ver el deploy en vivo:**

1. **GitHub Actions:**
   - Ve a la pestaña "Actions" de tu repositorio
   - Verás 2 jobs:
     - ✅ **Build & Test** (CI)
     - ✅ **Deploy to Production** (CD)

2. **Docker Hub:**
   - Ve a `https://hub.docker.com/u/TU_USERNAME`
   - Deberías ver 6 repositorios nuevos:
     - `aurontek-gateway`
     - `aurontek-usuarios`
     - `aurontek-tickets`
     - `aurontek-chat`
     - `aurontek-notificaciones`
     - `aurontek-ia`

3. **Vercel:**
   - Dashboard → Tu proyecto
   - Status: ✅ Ready
   - URL: tu dominio de producción

4. **EC2:**
   ```bash
   # Conectar a EC2
   ssh -i aurontek-key.pem ubuntu@TU_EC2_IP
   
   # Ver contenedores corriendo
   docker ps
   
   # Deberías ver 6 contenedores
   ```

**✅ ¡Tu aplicación está en producción!**

---

### 4.4 Workflow Completo: dev → test → main

**Escenario típico:**

```bash
# 1. Desarrollar nueva feature en dev
git checkout dev
# ... hacer cambios ...
git add .
git commit -m "feat: nuevo módulo de reportes"
git push origin dev
# ✅ CI corre, Vercel crea preview

# 2. Si todo está bien, mover a test
git checkout test
git merge dev
git push origin test
# ✅ CI corre, Vercel crea preview de test

# 3. Probar en el preview de test
# Abrir https://aurontek-test-xxx.vercel.app
# Probar todas las funcionalidades

# 4. Si las pruebas pasan, desplegar a producción
git checkout main
git merge test
git push origin main
# 🚀 CI + CD corren, DEPLOY A PRODUCCIÓN

# 5. Verificar producción
# Frontend: https://aurontek.vercel.app
# Backend: http://TU_EC2_IP:3000/health
```

---

## Parte 5: Monitoreo y Troubleshooting

### 5.1 Monitoreo de EC2

```bash
# Conectar a EC2
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Ver uso de memoria (debería estar usando swap)
free -h

# Ver uso de CPU y procesos
htop

# Ver logs de un servicio
docker logs -f gateway-svc

# Ver logs de todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart gateway-svc

# Reiniciar todos los servicios
docker-compose -f docker-compose.prod.yml restart
```

---

### 5.2 Problemas Comunes

#### ❌ Error: "Out of Memory" en EC2

**Solución:**
```bash
# Verificar que swap esté activo
swapon --show

# Si no está activo, crearlo
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### ❌ Error: GitHub Actions no puede conectar a EC2

**Solución:**
- Verifica que `EC2_SSH_KEY` en GitHub Secrets tiene el contenido completo del `.pem`
- Verifica que el Security Group de EC2 permite SSH (puerto 22) desde GitHub Actions IPs
- Cambia la regla SSH a "0.0.0.0/0" temporalmente para debug

#### ❌ Error: Servicios no pueden conectar a MongoDB/RabbitMQ

**Solución:**
- Verifica que `MONGODB_URI` y `RABBITMQ_URL` en GitHub Secrets son correctos
- Verifica que MongoDB Atlas permite acceso desde cualquier IP (0.0.0.0/0)
- Prueba la conexión manualmente desde EC2:
  ```bash
  docker run --rm mongo:6.0 mongosh "mongodb+srv://..."
  ```

#### ❌ Frontend no puede conectar al backend

**Solución:**
- Actualiza `REACT_APP_API_URL` en Vercel con la IP correcta de EC2
- Verifica que el Security Group de EC2 permite tráfico en puerto 3000
- Considera configurar CORS en el backend para permitir tu dominio de Vercel

---

### 5.3 Rollback (Volver a Versión Anterior)

Si un deploy rompe producción:

**Opción 1: Revertir commit**
```bash
git checkout main
git revert HEAD
git push origin main
# Automáticamente despliega la versión anterior
```

**Opción 2: Re-deploy de imagen anterior**
```bash
# Conectar a EC2
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Listar tags disponibles en Docker Hub y cambiar IMAGE_TAG en .env
nano .env
# Cambiar IMAGE_TAG=latest a IMAGE_TAG=abc123 (commit SHA anterior)

# Re-deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🎉 ¡Felicidades!

Has configurado un pipeline de CI/CD completo con:
- ✅ Desarrollo seguro en `dev`
- ✅ Testing en `test`
- ✅ Deployment automático a producción en `main`
- ✅ Frontend en Vercel con CDN global
- ✅ Backend en EC2 optimizado para Free Tier
- ✅ Base de datos y message broker en la nube

**Tu workflow es:**
```
🔨 Desarrollar en dev → 🧪 Probar en test → 🚀 Mergear a main = PRODUCCIÓN
```
