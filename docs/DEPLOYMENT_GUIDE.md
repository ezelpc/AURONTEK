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
7. [Parte 6: Post-Despliegue (Verificación y Optimización)](#parte-6-post-despliegue-verificación-y-optimización)

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

## Parte 6: Post-Despliegue (Verificación y Optimización)

### 6.1 Verificación Inicial del Despliegue

Una vez que el deployment ha completado exitosamente, sigue estos pasos para verificar que todo funcione correctamente.

#### Paso 1: Verificar Contenedores en EC2

```bash
# Conectar a EC2
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Ver todos los contenedores corriendo
docker ps

# Deberías ver estos 6 contenedores:
# - gateway-svc
# - usuarios-svc
# - tickets-svc
# - chat-svc
# - notificaciones-svc
# - ia-svc
```

**Salida esperada:**
```
CONTAINER ID   IMAGE                           STATUS         PORTS
abc123def456   aurontek-gateway:latest         Up 2 minutes   0.0.0.0:3000->3000/tcp
def456ghi789   aurontek-usuarios:latest        Up 2 minutes   3001/tcp
ghi789jkl012   aurontek-tickets:latest         Up 2 minutes   3002/tcp
jkl012mno345   aurontek-chat:latest            Up 2 minutes   3003/tcp
mno345pqr678   aurontek-notificaciones:latest  Up 2 minutes   3004/tcp
pqr678stu901   aurontek-ia:latest              Up 2 minutes   3005/tcp
```

#### Paso 2: Verificar Logs de los Servicios

```bash
# Ver logs del API Gateway (debería mostrar "Server running on port 3000")
docker logs gateway-svc --tail 50

# Ver logs de cada servicio individual
docker logs usuarios-svc --tail 30
docker logs tickets-svc --tail 30
docker logs chat-svc --tail 30
docker logs notificaciones-svc --tail 30
docker logs ia-svc --tail 30

# Ver logs en tiempo real (Ctrl+C para salir)
docker-compose -f /opt/aurontek/docker-compose.prod.yml logs -f
```

**Busca en los logs:**
- ✅ "Server running on port XXXX"
- ✅ "Connected to MongoDB"
- ✅ "Connected to RabbitMQ"
- ❌ Errores de conexión
- ❌ Stack traces

#### Paso 3: Verificar Uso de Recursos

```bash
# Ver memoria (debe estar usando swap)
free -h

# Ver procesos en tiempo real
htop

# Ver uso de disco
df -h

# Ver estadísticas de Docker
docker stats
```

**Valores normales para t2.micro:**
- **RAM**: ~900MB usado (de 1GB) + 1-2GB de swap usado
- **CPU**: 5-30% en reposo
- **Disco**: <5GB usado (de 30GB disponibles)

---

### 6.2 Pruebas de Endpoints (Health Checks)

#### Desde EC2 (pruebas internas):

```bash
# Health check del API Gateway
curl http://localhost:3000/health

# Response esperado:
# {"status":"ok","service":"api-gateway"}

# Health check de cada microservicio
curl http://localhost:3001/health  # usuarios-svc
curl http://localhost:3002/health  # tickets-svc
curl http://localhost:3003/health  # chat-svc
curl http://localhost:3004/health  # notificaciones-svc
curl http://localhost:3005/health  # ia-svc
```

#### Desde tu computadora local (pruebas externas):

```bash
# Reemplaza TU_EC2_IP con la IP pública de tu EC2

# Health check público
curl http://TU_EC2_IP:3000/health

# Test de autenticación (debería devolver 400 o 401, no 500)
curl -X POST http://TU_EC2_IP:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

**Desde el navegador:**
- Abre `http://TU_EC2_IP:3000/health`
- Deberías ver: `{"status":"ok","service":"api-gateway"}`

---

### 6.3 Verificar Frontend en Vercel

1. **Ir a Vercel Dashboard:**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Selecciona tu proyecto `AURONTEK`

2. **Verificar deployment:**
   - ✅ Status: "Ready"
   - ✅ URL de producción activa
   - ✅ Build exitoso

3. **Probar el frontend:**
   - Abre la URL de producción
   - Verifica que cargue correctamente
   - Abre DevTools (F12) → Console
   - **No debería haber errores de CORS o de conexión al backend**

4. **Actualizar URL de API (si es necesario):**
   ```bash
   # Si el frontend no puede conectar al backend:
   # Ve a Vercel → Settings → Environment Variables
   # Actualiza REACT_APP_API_URL a: http://TU_EC2_IP:3000
   # Redeploy desde Vercel Dashboard
   ```

---

### 6.4 Troubleshooting: Error SSH Timeout en GitHub Actions

> [!IMPORTANT]
> Si experimentaste el error `dial tcp ***:22: i/o timeout` durante el deployment, aquí está la solución definitiva.

#### Causa del Problema

GitHub Actions no pudo conectarse a tu EC2 por SSH porque el **Security Group** de AWS no permitía conexiones SSH desde las IPs dinámicas de GitHub Actions.

#### Solución Permanente

**Opción 1: Permitir SSH desde cualquier IP (Más Simple)**

1. Ve a **AWS Console → EC2 → Security Groups**
2. Selecciona tu security group `aurontek-sg`
3. **Inbound Rules → Edit inbound rules**
4. Modifica la regla SSH (puerto 22):
   - **Type**: SSH
   - **Port**: 22
   - **Source**: `0.0.0.0/0` (Anywhere IPv4)
   - **Description**: `SSH from GitHub Actions`
5. **Save rules**

**Opción 2: Usar GitHub IP Ranges (Más Seguro)**

GitHub publica sus rangos de IPs que puedes usar:

1. Ve a [https://api.github.com/meta](https://api.github.com/meta)
2. Busca la sección `"actions"`
3. Agrega reglas para cada rango CIDR en tu Security Group

**Alternativa: Usar AWS Systems Manager (Sin SSH)**

Para evitar exponer el puerto 22 completamente, considera usar AWS Systems Manager Session Manager en lugar de SSH directo. Esto requiere configuración adicional pero es más seguro.

#### Verificar que el Fix Funcionó

Después de ajustar el Security Group, prueba la conexión SSH manualmente:

```bash
# Desde tu computadora local
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Si conecta exitosamente, GitHub Actions también podrá conectar
```

Luego haz un push a `main` y verifica que el deployment funcione sin errores.

---

### 6.5 Configurar Monitoreo Continuo

#### 6.5.1 Crear Script de Monitoreo en EC2

```bash
# Conectar a EC2
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Crear script de monitoreo
sudo nano /usr/local/bin/aurontek-health.sh
```

Pega este contenido:

```bash
#!/bin/bash
echo "==================================="
echo "AURONTEK Health Check - $(date)"
echo "==================================="
echo ""

echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "💾 Memory Usage:"
free -h
echo ""

echo "💿 Disk Usage:"
df -h /
echo ""

echo "🌐 API Gateway Health:"
curl -s http://localhost:3000/health || echo "❌ Gateway not responding"
echo ""

echo "==================================="
```

Guardar y dar permisos:

```bash
sudo chmod +x /usr/local/bin/aurontek-health.sh

# Ejecutar para probar
sudo /usr/local/bin/aurontek-health.sh
```

#### 6.5.2 Configurar Cron Job para Logs Automáticos

```bash
# Editar crontab
crontab -e

# Agregar esta línea (ejecuta health check cada hora)
0 * * * * /usr/local/bin/aurontek-health.sh >> /var/log/aurontek-health.log 2>&1

# Ver logs históricos
tail -f /var/log/aurontek-health.log
```

#### 6.5.3 Alertas de Uptime con UptimeRobot (Gratis)

1. **Crear cuenta en UptimeRobot:**
   - [https://uptimerobot.com/](https://uptimerobot.com/)
   - Plan gratuito: 50 monitores, checks cada 5 minutos

2. **Crear monitor:**
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: AURONTEK API Gateway
   - **URL**: `http://TU_EC2_IP:3000/health`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Tu email

3. **Notificaciones:**
   - Recibirás emails si el servicio está caído
   - Dashboard público disponible

---

### 6.6 Optimizaciones Recomendadas

#### 6.6.1 Configurar Elastic IP (Opcional)

Por defecto, la IP pública de EC2 cambia si reinicias la instancia. Para evitar esto:

1. **AWS Console → EC2 → Elastic IPs**
2. **Allocate Elastic IP address**
3. **Actions → Associate Elastic IP address**
4. Selecciona tu instancia `aurontek-backend`
5. **Associate**

**Ventaja:** La IP nunca cambiará, incluso si reinicias EC2.

**⚠️ Importante:** Elastic IPs gratuitas SOLO si están asociadas a una instancia corriendo. Si detienes la instancia, te cobran $0.005/hora.

#### 6.6.2 Configurar Dominio Personalizado (Recomendado)

En lugar de usar `http://3.123.45.67:3000`, usa un dominio:

1. **Comprar dominio en Namecheap/GoDaddy** (ejemplo: `aurontek.com`)
2. **Crear registro DNS A:**
   - Host: `api` o `@`
   - Value: `TU_EC2_IP`
   - TTL: 3600
3. **Actualizar Vercel:**
   - `REACT_APP_API_URL` → `http://api.aurontek.com:3000`

#### 6.6.3 Configurar HTTPS con SSL/TLS (Producción Ready)

Para usar HTTPS y eliminar el puerto 3000 en la URL:

**Opción 1: Nginx Reverse Proxy + Let's Encrypt (Gratis)**

```bash
# Conectar a EC2
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Instalar Nginx y Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurar Nginx
sudo nano /etc/nginx/sites-available/aurontek
```

Configuración básica:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/aurontek /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtener certificado SSL gratuito
sudo certbot --nginx -d api.tudominio.com
```

**Ahora podrás usar:** `https://api.tudominio.com` (sin puerto!)

**Opción 2: Cloudflare (Más simple)**

1. Agrega tu dominio a Cloudflare (gratis)
2. Crea registro DNS A → TU_EC2_IP
3. Activa Proxy (nube naranja)
4. SSL/TLS → Full
5. Usa `https://api.tudominio.com` directamente

#### 6.6.4 Optimizar Docker para Producción

```bash
# Limpiar recursos no usados semanalmente
sudo crontab -e

# Agregar (ejecuta cada domingo a las 3am)
0 3 * * 0 docker system prune -af --volumes
```

#### 6.6.5 Backup Automático de EC2

**Opción 1: AWS Snapshots Manuales**

1. **EC2 → Volumes → Selecciona tu volumen**
2. **Actions → Create snapshot**
3. Description: `aurontek-backup-YYYY-MM-DD`

**Opción 2: AWS Backup (Automatizado)**

1. **AWS Backup → Create backup plan**
2. Frequency: Daily
3. Retention: 7 days
4. Resources: Tu instancia EC2

---

### 6.7 Checklist de Post-Despliegue

Marca cada item después de verificarlo:

- [ ] **Contenedores:** Todos los 6 servicios corriendo sin errores
- [ ] **Logs:** No hay stack traces ni errores críticos
- [ ] **Memoria:** Swap configurado y en uso
- [ ] **Health Checks:** Todos los endpoints `/health` responden
- [ ] **Frontend:** Vercel desplegado y accesible
- [ ] **Conectividad:** Frontend puede llamar al backend sin errores CORS
- [ ] **Security Group:** Puerto 22 (SSH) configurado para GitHub Actions
- [ ] **Security Group:** Puerto 3000 abierto a internet
- [ ] **Monitoreo:** Script de health check funcionando
- [ ] **UptimeRobot:** Monitor configurado (opcional)
- [ ] **Dominio:** DNS configurado apuntando a EC2 (opcional)
- [ ] **SSL:** HTTPS configurado (opcional pero recomendado para producción)
- [ ] **Backup:** Snapshot de EC2 creado

---

### 6.8 Comandos Rápidos de Referencia

```bash
# Conectar a EC2
ssh -i aurontek-key.pem ubuntu@TU_EC2_IP

# Ver status rápido
docker ps
free -h
df -h

# Health check completo
/usr/local/bin/aurontek-health.sh

# Ver logs en vivo
docker-compose -f /opt/aurontek/docker-compose.prod.yml logs -f

# Reiniciar todo
docker-compose -f /opt/aurontek/docker-compose.prod.yml restart

# Reiniciar un servicio específico
docker-compose -f /opt/aurontek/docker-compose.prod.yml restart gateway-svc

# Pull nuevas imágenes
docker-compose -f /opt/aurontek/docker-compose.prod.yml pull

# Limpiar recursos
docker system prune -af

# Ver uso de recursos en tiempo real
docker stats
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
- ✅ **Post-deployment verificado y optimizado**

**Tu workflow es:**
```
🔨 Desarrollar en dev → 🧪 Probar en test → 🚀 Mergear a main = PRODUCCIÓN
```
