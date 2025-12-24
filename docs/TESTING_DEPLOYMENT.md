# 🧪 Guía de Pruebas de Deployment

## 📋 Checklist de Verificación

### 1️⃣ Verificar Contenedores Corriendo

#### En EDGE (IP: 3.238.124.15)
```bash
ssh -i D:/Descargas/llave-ttr.pem ubuntu@3.238.124.15

# Ver contenedores corriendo
docker ps

# Deberías ver:
# - gateway-svc (healthy)
# - redis (healthy)
```

#### En CORE (IP: 172.31.78.64)
```bash
# Desde EDGE
ssh ubuntu@172.31.78.64

# Ver contenedores corriendo
docker ps

# Deberías ver:
# - usuarios-svc (healthy)
# - tickets-svc (healthy)
# - chat-svc (healthy)
# - notificaciones-svc (healthy)
# - ia-svc (healthy)
```

---

### 2️⃣ Health Checks de Servicios

#### Desde EDGE (verificar conectividad interna)
```bash
# Gateway (local)
curl http://localhost:3000/health
# Esperado: {"status":"OK","gateway":"Running","redis":"Connected"}

# Servicios de CORE (desde EDGE)
curl http://172.31.78.64:3001/health  # usuarios-svc
curl http://172.31.78.64:3002/health  # tickets-svc
curl http://172.31.78.64:3003/health  # chat-svc
curl http://172.31.78.64:3004/health  # notificaciones-svc
curl http://172.31.78.64:3005/health  # ia-svc

# Todos deberían retornar status OK o healthy
```

---

### 3️⃣ Pruebas desde Internet (Dominio Público)

#### Health Check Público
```bash
# Desde tu máquina local
curl https://aurontekhq-api.ddns.net/health

# Esperado: {"status":"OK","gateway":"Running","redis":"Connected"}
```

#### Test de CORS (Preflight)
```bash
curl -i -X OPTIONS https://aurontekhq-api.ddns.net/api/auth/login \
  -H "Origin: https://aurontek.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Esperado en headers:
# access-control-allow-origin: https://aurontek.vercel.app
# access-control-allow-credentials: true
```

---

### 4️⃣ Pruebas Funcionales desde Frontend

#### A. Abrir Frontend de Vercel
```
https://aurontek.vercel.app
```

#### B. Verificar Conexión
1. Abre las **DevTools** del navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login o cualquier acción
4. Verifica que las requests a `aurontekhq-api.ddns.net` retornen **200 OK**

#### C. Pruebas Específicas

**Login de Empresa:**
1. Ve a `/empresa/validar-acceso`
2. Ingresa código de acceso: `AURONTEK`
3. Verifica que redirija a login
4. Intenta login con credenciales de prueba

**Login de Admin:**
1. Ve a `/admin/login`
2. Intenta login con: `eperez@aurontek.com` / password
3. Verifica que funcione correctamente

---

### 5️⃣ Verificar Logs (Si hay errores)

#### Gateway Logs
```bash
# En EDGE
docker logs gateway-svc --tail 100

# Buscar errores de:
# - Conexión a Redis
# - Conexión a servicios CORE
# - Errores de CORS (solo si vienen del frontend)
```

#### Logs de Servicios CORE
```bash
# En CORE
docker logs usuarios-svc --tail 50
docker logs tickets-svc --tail 50
docker logs chat-svc --tail 50
docker logs notificaciones-svc --tail 50
docker logs ia-svc --tail 50

# Buscar errores de:
# - Conexión a MongoDB
# - Conexión a RabbitMQ
# - Conexión a Redis (chat-svc)
```

---

### 6️⃣ Verificar Recursos del Sistema

#### Memoria y CPU
```bash
# En EDGE
docker stats --no-stream

# En CORE
docker stats --no-stream

# Verificar que ningún contenedor use >90% de su límite de memoria
```

#### Espacio en Disco
```bash
# En ambas instancias
df -h
docker system df

# Si hay poco espacio, limpiar:
docker image prune -af
```

---

### 7️⃣ Pruebas de Endpoints Específicos

#### Obtener CSRF Token
```bash
curl https://aurontekhq-api.ddns.net/api/csrf-token

# Esperado: {"csrfToken":"..."}
```

#### Test de Proxy a Usuarios
```bash
curl -X GET https://aurontekhq-api.ddns.net/api/empresas \
  -H "Origin: https://aurontek.vercel.app"

# Debería retornar lista de empresas o error de autenticación
```

---

## ✅ Checklist Final

- [ ] Todos los contenedores están corriendo (EDGE + CORE)
- [ ] Todos los health checks retornan OK
- [ ] El dominio público responde correctamente
- [ ] CORS funciona desde el frontend de Vercel
- [ ] No hay errores en los logs
- [ ] Uso de memoria está dentro de límites
- [ ] El frontend puede hacer login correctamente
- [ ] Las requests del frontend llegan al backend

---

## 🚨 Troubleshooting

### Problema: Gateway retorna 500
**Solución:** Ver logs del gateway y verificar conexión a Redis

### Problema: Servicios CORE no responden
**Solución:** Verificar Security Group permite tráfico desde EDGE

### Problema: CORS error desde frontend
**Solución:** Verificar que `FRONTEND_URL` en `.env` sea exactamente `https://aurontek.vercel.app`

### Problema: MongoDB connection error
**Solución:** Verificar que `MONGODB_URI` esté correctamente configurado en `.env` de CORE

### Problema: Redis connection timeout
**Solución:** Verificar que Redis esté corriendo en EDGE y que `REDIS_PASSWORD` sea correcto

---

## 📊 Comandos Útiles

```bash
# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Reiniciar un servicio específico
docker restart gateway-svc

# Ver variables de entorno de un contenedor
docker exec gateway-svc env

# Ver uso de recursos en tiempo real
docker stats

# Limpiar imágenes antiguas
docker image prune -af

# Ver logs en tiempo real
docker logs -f gateway-svc
```

---

## 🎯 Resultado Esperado

Si todo está funcionando correctamente:

1. ✅ `docker ps` muestra todos los contenedores como `healthy`
2. ✅ Health checks retornan status OK
3. ✅ Frontend de Vercel puede comunicarse con el backend
4. ✅ Login funciona correctamente
5. ✅ No hay errores en los logs
6. ✅ Uso de memoria está dentro de límites (< 90%)

**¡Deployment exitoso!** 🚀
