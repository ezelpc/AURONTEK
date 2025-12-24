# 🚀 Guía de Deployment - AURONTEK

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Setup Inicial](#setup-inicial)
3. [Deployment Manual](#deployment-manual)
4. [Deployment Automático (CI/CD)](#deployment-automatico)
5. [Verificación](#verificacion)
6. [Rollback](#rollback)

---

## 1. Prerequisitos

### AWS EC2
- ✅ 2 instancias t2.micro (Ubuntu 22.04)
  - EDGE: IP pública
  - CORE: Solo IP privada
- ✅ Security Groups configurados
- ✅ Llave SSH (.pem)

### Servicios Externos
- ✅ MongoDB Atlas (Free Tier)
- ✅ CloudAMQP (RabbitMQ Free Tier)
- ✅ Cloudinary (Free Tier)
- ✅ Resend (Email Free Tier)
- ✅ No-IP (Dominio DDNS)
- ✅ Docker Hub (Registry)

### GitHub
- ✅ Repository con acceso
- ✅ Secrets configurados (ver [GITHUB_SECRETS.md](./GITHUB_SECRETS.md))

---

## 2. Setup Inicial

### 2.1 Setup EDGE (Instancia Pública)

```bash
# 1. Conectar a EDGE
ssh -i tu-llave.pem ubuntu@EDGE_PUBLIC_IP

# 2. Crear directorio de trabajo
mkdir -p ~/aurontek-deploy
cd ~/aurontek-deploy

# 3. Descargar script de setup
curl -o setup-edge.sh https://raw.githubusercontent.com/ezelpc/AURONTEK/main/scripts/setup-edge.sh
chmod +x setup-edge.sh

# 4. Ejecutar setup script
bash setup-edge.sh

# 5. Logout y login (para aplicar grupo docker)
exit
ssh -i tu-llave.pem ubuntu@EDGE_PUBLIC_IP
```

### 2.2 Setup CORE (Instancia Privada)

```bash
# 1. Desde EDGE, copiar llave SSH
scp -i tu-llave.pem tu-llave.pem ubuntu@EDGE_IP:~/.ssh/id_rsa
ssh ubuntu@EDGE_IP "chmod 600 ~/.ssh/id_rsa"

# 2. SSH de EDGE a CORE
ssh ubuntu@CORE_PRIVATE_IP

# 3. Crear directorio de trabajo
mkdir -p ~/aurontek-deploy
cd ~/aurontek-deploy

# 4. Descargar script de setup
curl -o setup-core.sh https://raw.githubusercontent.com/ezelpc/AURONTEK/main/scripts/setup-core.sh
chmod +x setup-core.sh

# 5. Ejecutar setup script
bash setup-core.sh

# 6. Logout y login
exit
ssh ubuntu@CORE_PRIVATE_IP
```

### 2.3 Configurar Nginx + SSL

```bash
# En EDGE
cd ~/aurontek-deploy

# Descargar configuración de Nginx
curl -o aurontek.conf https://raw.githubusercontent.com/ezelpc/AURONTEK/main/nginx/aurontek.conf

# Copiar configuración de Nginx
sudo cp aurontek.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/aurontek.conf /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx

# Generar certificado SSL
sudo certbot --nginx -d aurontekhq-api.ddns.net
```

---

## 3. Deployment Manual

### 3.1 Deploy a EDGE

```bash
# En EDGE
cd /opt/aurontek

# Descargar docker-compose.edge.yml
curl -o docker-compose.edge.yml https://raw.githubusercontent.com/ezelpc/AURONTEK/main/docker-compose.edge.yml

# Crear .env
cat > .env <<EOF
DOCKER_USERNAME=enpc29
IMAGE_TAG=latest
CORE_PRIVATE_IP=172.31.X.X
FRONTEND_URL=https://aurontek.vercel.app
CUSTOM_DOMAIN=https://aurontekhq-api.ddns.net
JWT_SECRET=tu_jwt_secret
SERVICE_TOKEN=tu_service_token
RECAPTCHA_SECRET_KEY=tu_recaptcha_key
RECAPTCHA_TEST_TOKEN=test_token
REDIS_PASSWORD=tu_redis_password_seguro
EOF

# Pull de imágenes
docker compose -f docker-compose.edge.yml pull

# Iniciar servicios
docker compose -f docker-compose.edge.yml up -d

# Verificar
docker ps
docker logs gateway-svc
```

### 3.2 Deploy a CORE

```bash
# En CORE (vía SSH desde EDGE)
cd /opt/aurontek

# Descargar docker-compose.core.yml
curl -o docker-compose.core.yml https://raw.githubusercontent.com/ezelpc/AURONTEK/main/docker-compose.core.yml

# Crear .env
cat > .env <<EOF
DOCKER_USERNAME=enpc29
IMAGE_TAG=latest
EDGE_PRIVATE_IP=172.31.Y.Y
MONGODB_URI=mongodb+srv://...
RABBITMQ_URL=amqps://...
JWT_SECRET=tu_jwt_secret
SERVICE_TOKEN=tu_service_token
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RECAPTCHA_SECRET_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
REDIS_PASSWORD=tu_redis_password_seguro
EOF

# Pull de imágenes
docker compose -f docker-compose.core.yml pull

# Iniciar servicios
docker compose -f docker-compose.core.yml up -d

# Verificar
docker ps
docker logs usuarios-svc
```

---

## 4. Deployment Automático (CI/CD)

### 4.1 Configurar GitHub Secrets

Ver [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) para lista completa.

**Críticos:**
- `EDGE_HOST` - IP pública de EDGE
- `EDGE_PRIVATE_IP` - IP privada de EDGE
- `CORE_PRIVATE_IP` - IP privada de CORE
- `EC2_SSH_KEY` - Llave privada SSH (completa)
- `REDIS_PASSWORD` - Password de Redis

### 4.2 Workflow Automático

El CI/CD se ejecuta automáticamente en cada push a `main`:

```yaml
# .github/workflows/ci-cd.yml

1. Build & Test → Construye todas las imágenes
2. Build & Push → Sube a Docker Hub
3. Deploy EDGE → Despliega en instancia pública
4. Deploy CORE → Despliega en instancia privada
```

### 4.3 Monitorear CI/CD

```bash
# Ver en GitHub Actions
https://github.com/ezelpc/AURONTEK/actions

# Ver logs en EC2 EDGE
ssh ubuntu@EDGE_IP
docker logs -f gateway-svc

# Ver logs en EC2 CORE
ssh ubuntu@EDGE_IP
ssh ubuntu@CORE_PRIVATE_IP
docker logs -f usuarios-svc
```

---

## 5. Verificación

### 5.1 Health Checks

```bash
# EDGE
curl http://localhost:3000/health
curl https://aurontekhq-api.ddns.net/health

# CORE (desde EDGE)
curl http://CORE_PRIVATE_IP:3001/health  # usuarios
curl http://CORE_PRIVATE_IP:3002/health  # tickets
curl http://CORE_PRIVATE_IP:3003/health  # chat
curl http://CORE_PRIVATE_IP:3004/health  # notificaciones
curl http://CORE_PRIVATE_IP:3005/health  # ia
```

### 5.2 Conectividad EDGE → CORE

```bash
# Desde EDGE
curl -i http://CORE_PRIVATE_IP:3001/health

# Debe retornar 200 OK
```

### 5.3 Test de Login

```bash
curl -X POST https://aurontekhq-api.ddns.net/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://aurontek.vercel.app" \
  -d '{
    "correo": "test@test.com",
    "password": "test123",
    "recaptchaToken": "test"
  }'
```

### 5.4 Verificar CORS

```bash
curl -i -X OPTIONS https://aurontekhq-api.ddns.net/api/auth/login \
  -H "Origin: https://aurontek.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Debe incluir:
# access-control-allow-origin: https://aurontek.vercel.app
# access-control-allow-credentials: true
```

---

## 6. Rollback

### 6.1 Rollback Rápido (Imagen Anterior)

```bash
# EDGE
cd /opt/aurontek
docker compose -f docker-compose.edge.yml down
docker pull enpc29/aurontek-gateway:COMMIT_SHA_ANTERIOR
docker tag enpc29/aurontek-gateway:COMMIT_SHA_ANTERIOR enpc29/aurontek-gateway:latest
docker compose -f docker-compose.edge.yml up -d

# CORE (similar para cada servicio)
docker compose -f docker-compose.core.yml down
docker pull enpc29/aurontek-usuarios:COMMIT_SHA_ANTERIOR
# ... repetir para cada servicio
docker compose -f docker-compose.core.yml up -d
```

### 6.2 Rollback Completo (Git)

```bash
# 1. Revertir commit en Git
git revert HEAD
git push origin main

# 2. CI/CD automáticamente desplegará la versión anterior
```

---

## 7. Comandos Útiles

### Logs
```bash
# Ver logs en tiempo real
docker logs -f gateway-svc

# Ver últimas 100 líneas
docker logs --tail 100 gateway-svc

# Ver logs con timestamps
docker logs -t gateway-svc
```

### Recursos
```bash
# Ver uso de memoria
free -h
docker stats

# Ver espacio en disco
df -h
docker system df
```

### Limpieza
```bash
# Limpiar imágenes viejas
docker image prune -af

# Limpiar todo (CUIDADO)
docker system prune -af
```

---

## 8. Troubleshooting

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para problemas comunes.

### Problema: Gateway no inicia
```bash
# Verificar logs
docker logs gateway-svc

# Verificar que Redis esté corriendo
docker ps | grep redis

# Reiniciar
docker compose -f docker-compose.edge.yml restart gateway
```

### Problema: No hay conectividad EDGE → CORE
```bash
# Verificar Security Groups
# CORE SG debe permitir puertos 3001-3005 desde EDGE SG

# Verificar IP privada
echo $CORE_PRIVATE_IP

# Test de conectividad
ping CORE_PRIVATE_IP
telnet CORE_PRIVATE_IP 3001
```

---

## 📚 Referencias

- [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)
- [SECURITY.md](./SECURITY.md)
- [MAINTENANCE.md](./MAINTENANCE.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
