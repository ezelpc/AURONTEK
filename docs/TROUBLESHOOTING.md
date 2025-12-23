# 🆘 Troubleshooting - AURONTEK

## 📋 Índice

1. [Problemas Comunes](#problemas-comunes)
2. [Deployment](#deployment)
3. [Conectividad](#conectividad)
4. [Performance](#performance)
5. [Seguridad](#seguridad)

---

## 🔧 Problemas Comunes

### 1. Gateway no inicia

**Síntomas:**
```bash
docker ps  # gateway-svc no aparece o está "Restarting"
```

**Diagnóstico:**
```bash
# Ver logs
docker logs gateway-svc

# Errores comunes:
# - "Redis connection refused"
# - "Cannot find module"
# - "Port 3000 already in use"
```

**Soluciones:**

#### Redis no disponible
```bash
# Verificar que Redis esté corriendo
docker ps | grep redis

# Si no está, iniciar
docker compose -f docker-compose.edge.yml up -d redis

# Verificar conectividad
docker exec redis redis-cli -a $REDIS_PASSWORD ping
```

#### Dependencias faltantes
```bash
# Reconstruir imagen
cd backend/gateway-svc
npm install
docker build -t enpc29/aurontek-gateway:latest .
docker push enpc29/aurontek-gateway:latest

# En EC2
docker compose -f docker-compose.edge.yml pull gateway
docker compose -f docker-compose.edge.yml up -d --force-recreate gateway
```

#### Puerto en uso
```bash
# Ver qué está usando el puerto 3000
sudo netstat -tulpn | grep 3000

# Matar proceso
sudo kill -9 <PID>

# Reiniciar Gateway
docker compose -f docker-compose.edge.yml restart gateway
```

---

### 2. Error 502 Bad Gateway

**Síntomas:**
```
curl https://aurontekhq-api.ddns.net
# 502 Bad Gateway
```

**Diagnóstico:**
```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar Gateway
curl http://localhost:3000/health

# Ver logs de Nginx
tail -f /var/log/nginx/aurontek_error.log
```

**Soluciones:**

#### Gateway no responde
```bash
# Reiniciar Gateway
docker compose -f docker-compose.edge.yml restart gateway

# Verificar
curl http://localhost:3000/health
```

#### Nginx mal configurado
```bash
# Verificar configuración
sudo nginx -t

# Si hay errores, revisar
sudo nano /etc/nginx/sites-available/aurontek.conf

# Recargar
sudo systemctl reload nginx
```

---

### 3. CORS Error

**Síntomas:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Diagnóstico:**
```bash
# Probar CORS
curl -i -X OPTIONS https://aurontekhq-api.ddns.net/api/auth/login \
  -H "Origin: https://aurontek.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Debe incluir:
# access-control-allow-origin: https://aurontek.vercel.app
```

**Soluciones:**

#### Origin no permitido
```bash
# Verificar allowedOrigins en gateway
# backend/gateway-svc/src/app.ts

# Debe incluir:
const allowedOrigins = [
    process.env.FRONTEND_URL,  // https://aurontek.vercel.app
    process.env.CUSTOM_DOMAIN, // https://aurontekhq-api.ddns.net
    'http://localhost:5173'
];
```

#### Headers duplicados
```bash
# Verificar que Nginx NO agregue headers CORS
# nginx/aurontek.conf NO debe tener:
# add_header Access-Control-Allow-Origin ...

# Solo Gateway debe manejar CORS
```

---

### 4. Rate Limit Bloqueado

**Síntomas:**
```json
{
  "message": "Demasiados intentos de login. Bloqueado por 15 minutos."
}
```

**Diagnóstico:**
```bash
# Ver rate limits en Redis
docker exec redis redis-cli -a $REDIS_PASSWORD keys "rl_auth:*"
docker exec redis redis-cli -a $REDIS_PASSWORD get "rl_auth:IP_ADDRESS"
```

**Soluciones:**

#### Limpiar rate limit manualmente
```bash
# Limpiar todos los rate limits
docker exec redis redis-cli -a $REDIS_PASSWORD FLUSHDB

# Limpiar solo auth rate limits
docker exec redis redis-cli -a $REDIS_PASSWORD --scan --pattern "rl_auth:*" | xargs docker exec redis redis-cli -a $REDIS_PASSWORD DEL
```

#### Ajustar límites (temporal)
```bash
# Editar backend/gateway-svc/src/middleware/rate-limit.ts
# Aumentar limit temporalmente
limit: 10  # en lugar de 5

# Rebuild y deploy
```

---

### 5. Microservicio no responde

**Síntomas:**
```bash
curl http://CORE_PRIVATE_IP:3001/health
# Connection refused o timeout
```

**Diagnóstico:**
```bash
# En CORE, verificar contenedores
docker ps

# Ver logs del servicio
docker logs usuarios-svc

# Verificar puerto
sudo netstat -tulpn | grep 3001
```

**Soluciones:**

#### Servicio caído
```bash
# Reiniciar servicio
docker compose -f docker-compose.core.yml restart usuarios

# Ver logs
docker logs -f usuarios-svc
```

#### MongoDB no disponible
```bash
# Verificar conexión a MongoDB
docker exec usuarios-svc sh -c 'curl -s $MONGODB_URI'

# Si falla, verificar:
# - MONGODB_URI correcto en .env
# - IP de EC2 permitida en MongoDB Atlas
# - Network ACLs en MongoDB Atlas
```

---

## 🚀 Deployment

### CI/CD Falla

**Síntomas:**
```
GitHub Actions workflow failed
```

**Diagnóstico:**
```bash
# Ver logs en GitHub Actions
https://github.com/ezelpc/AURONTEK/actions

# Errores comunes:
# - "Secret not found"
# - "SSH connection refused"
# - "Docker build failed"
```

**Soluciones:**

#### Secret faltante
```bash
# Verificar en GitHub
Settings → Secrets → Actions

# Agregar secret faltante
# Ver GITHUB_SECRETS.md para lista completa
```

#### SSH falla
```bash
# Verificar llave SSH
# EC2_SSH_KEY debe incluir:
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----

# Verificar que EDGE_HOST sea correcto
# Debe ser IP pública, no privada
```

#### Build falla
```bash
# Ver logs de build en GitHub Actions
# Usualmente es:
# - Dependencia faltante en package.json
# - Error de TypeScript
# - Dockerfile incorrecto

# Probar build local
cd backend/gateway-svc
npm install
npm run build
```

---

## 🌐 Conectividad

### EDGE → CORE no funciona

**Síntomas:**
```bash
# Desde EDGE
curl http://CORE_PRIVATE_IP:3001/health
# Connection refused
```

**Diagnóstico:**
```bash
# Verificar IP privada
echo $CORE_PRIVATE_IP

# Ping
ping CORE_PRIVATE_IP

# Telnet
telnet CORE_PRIVATE_IP 3001
```

**Soluciones:**

#### Security Group incorrecto
```
AWS Console → EC2 → Security Groups → CORE SG

Inbound Rules:
- Type: Custom TCP
- Port: 3001-3005
- Source: EDGE Security Group ID
```

#### IP privada incorrecta
```bash
# En CORE, verificar IP
ip addr show | grep inet

# Actualizar .env en EDGE
CORE_PRIVATE_IP=172.31.X.X  # IP correcta
```

---

## ⚡ Performance

### Respuesta Lenta

**Síntomas:**
```bash
curl -w "@curl-format.txt" https://aurontekhq-api.ddns.net/health
# time_total > 1s
```

**Diagnóstico:**
```bash
# Ver uso de recursos
docker stats

# Ver logs de queries lentas
docker logs usuarios-svc | grep "slow query"

# Ver conexiones a DB
# En MongoDB Atlas → Metrics
```

**Soluciones:**

#### Memoria alta
```bash
# Ver uso
free -h

# Limpiar caché
sudo sync; echo 3 | sudo tee /proc/sys/vm/drop_caches

# Reiniciar servicios pesados
docker compose -f docker-compose.core.yml restart ia
```

#### DB queries lentas
```bash
# Agregar índices en MongoDB
# Ver queries lentas en Atlas
# Optimizar queries en código
```

---

## 🔒 Seguridad

### Muchos intentos de login fallidos

**Síntomas:**
```bash
docker logs gateway-svc | grep "401" | wc -l
# Número muy alto
```

**Diagnóstico:**
```bash
# Ver IPs sospechosas
docker logs gateway-svc | grep "401" | awk '{print $1}' | sort | uniq -c | sort -rn

# Ver rate limits
docker exec redis redis-cli -a $REDIS_PASSWORD keys "rl_auth:*"
```

**Soluciones:**

#### Bloquear IP en Nginx
```nginx
# /etc/nginx/sites-available/aurontek.conf
# Agregar antes de location /
deny 123.456.789.0;

# Recargar
sudo systemctl reload nginx
```

#### Reducir rate limit
```typescript
// backend/gateway-svc/src/middleware/rate-limit.ts
limit: 3  // en lugar de 5
windowMs: 30 * 60 * 1000  // 30 minutos en lugar de 15
```

---

## 📞 Soporte

### Comandos de Diagnóstico Rápido

```bash
#!/bin/bash
# quick-diag.sh

echo "=== SYSTEM INFO ==="
uname -a
uptime

echo -e "\n=== MEMORY ==="
free -h

echo -e "\n=== DISK ==="
df -h

echo -e "\n=== DOCKER ==="
docker ps

echo -e "\n=== NGINX ==="
sudo systemctl status nginx

echo -e "\n=== HEALTH CHECKS ==="
curl -s http://localhost:3000/health || echo "❌ Gateway DOWN"

echo -e "\n=== LOGS (últimas 10 líneas) ==="
docker logs --tail 10 gateway-svc
```

### Información para Reportar

Cuando reportes un problema, incluye:

1. **Descripción del problema**
2. **Pasos para reproducir**
3. **Output de `quick-diag.sh`**
4. **Logs relevantes**
5. **Cambios recientes**

---

## 📚 Referencias

- [Docker Troubleshooting](https://docs.docker.com/config/daemon/troubleshoot/)
- [Nginx Debugging](https://nginx.org/en/docs/debugging_log.html)
- [AWS EC2 Troubleshooting](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-troubleshoot.html)
