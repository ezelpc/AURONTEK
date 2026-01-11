# 🧪 Prueba Completa del Servicio de Notificaciones Corregido

## ✅ Prerequisitos

1. **Servicio en ejecución:**
   ```bash
   cd backend/notificaciones-svc
   npm run dev
   ```

2. **Gateway ejecutándose en puerto 3000:**
   ```bash
   cd backend/gateway-svc
   npm run dev
   ```

3. **Variables de entorno configuradas:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@aurontek.com
   SERVICE_TOKEN=desarrollo
   ```

---

## 🎯 Test 1: Verificar que el Servicio Está Activo

### Comando:
```bash
curl -X GET http://localhost:3004/health
```

### Respuesta Esperada (200):
```json
{
  "status": "OK",
  "service": "notificaciones-svc",
  "timestamp": "2025-01-11T10:30:45.123Z"
}
```

### ✅ Si funciona:
- El servicio se inició correctamente
- MongoDB está conectado
- Puerto 3004 está disponible

### ❌ Si da error:
- Verificar logs: `npm run dev` muestra errores
- Verificar puerto: `netstat -an | find ":3004"`
- Verificar MongoDB: `mongosh` debe conectar

---

## 🎯 Test 2: Obtener Token de Acceso

### Acción:
Inicia sesión en el frontend o crea un usuario de prueba

### Usar Token desde Console:
```javascript
// En la consola del navegador (DevTools -> Console)
localStorage.getItem('token')  // Copiar el valor
```

### O crear usuario de test:
```bash
# En la terminal de usuarios-svc
curl -X POST http://localhost:3001/api/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "correo": "test@example.com",
    "password": "TestPassword123!",
    "empresaId": "empresa_id"
  }'
```

---

## 🎯 Test 3: Listar Notificaciones del Usuario

### Comando:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

### Respuesta Esperada (200):
```json
[]  // Array vacío si es nuevo usuario
```

O si hay notificaciones:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "usuarioId": "507f1f77bcf86cd799439012",
    "titulo": "Ticket Creado",
    "mensaje": "Tu ticket #123 fue creado exitosamente",
    "tipo": "info",
    "leida": false,
    "metadata": {
      "ticketId": "123"
    },
    "createdAt": "2025-01-11T10:30:00.000Z"
  }
]
```

### ✅ Si funciona (200):
- GET `/api/notificaciones` responde correctamente
- El JWT se valida correctamente
- MongoDB se consulta correctamente

### ❌ Si da error 404:
- **Problema:** Prefijo de ruta incorrecto
- **Solución:** Verificar que `index.ts` tiene:
  ```typescript
  app.use('/api/notificaciones', notificationRoutes);
  ```

### ❌ Si da error 401:
- **Problema:** Token inválido o expirado
- **Solución:** Obtener token válido nuevamente

---

## 🎯 Test 4: Marcar Todas como Leídas

### Primero crear una notificación de test:
```bash
# Crear una notificación manualmente en MongoDB
mongosh
> use aurontek_notificaciones
> db.notificacions.insertOne({
    usuarioId: "test_user_id",
    titulo: "Test Notification",
    mensaje: "This is a test",
    tipo: "info",
    leida: false,
    createdAt: new Date()
  })
```

### Comando:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X PATCH http://localhost:3000/api/notificaciones/leer-todas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

### Respuesta Esperada (200):
```json
{
  "msg": "Todas marcadas como leídas"
}
```

### Verificación:
```bash
# Volver a listar notificaciones
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer $TOKEN"

# Las notificaciones deben tener "leida": true
```

---

## 🎯 Test 5: Enviar Email del Sistema

### Comando (sin autenticación JWT):
```bash
curl -X POST http://localhost:3000/api/notificaciones/system-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "tu_email@example.com",
    "subject": "Test Email from Aurontek",
    "html": "<h1>Test Email</h1><p>This is a test email from the corrected notification service.</p>",
    "text": "Test Email from Aurontek - This is a test"
  }' \
  -v
```

### Respuesta Esperada (200):
```json
{
  "msg": "Email enviado exitosamente",
  "to": "tu_email@example.com",
  "subject": "Test Email from Aurontek"
}
```

### Verificación:
- Revisar el email en tu bandeja de entrada
- Puede tardar 30 segundos en llegar

### ❌ Si da error 500:
```json
{
  "msg": "Error al enviar email",
  "error": "Invalid RESEND_API_KEY"
}
```

**Solución:** Verificar que `RESEND_API_KEY` es válido en `.env`

---

## 🎯 Test 6: Contar Notificaciones No Leídas

### Comando:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/notificaciones/no-leidas/count \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

### Respuesta Esperada (200):
```json
{
  "count": 0
}
```

O si hay notificaciones sin leer:
```json
{
  "count": 3
}
```

---

## 🎯 Test 7: Marcar una Notificación como Leída

### Primero obtener el ID de una notificación:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer $TOKEN"

# Copiar el "_id" de la primera notificación
```

### Comando:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NOTIF_ID="507f1f77bcf86cd799439011"

curl -X PATCH http://localhost:3000/api/notificaciones/$NOTIF_ID/leer \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

### Respuesta Esperada (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "usuarioId": "507f1f77bcf86cd799439012",
  "titulo": "Ticket Creado",
  "leida": true,
  "createdAt": "2025-01-11T10:30:00.000Z"
}
```

---

## 🎯 Test 8: Frontend - Notifications Menu

### Pasos:
1. Abre el navegador en `http://localhost:5173` (frontend)
2. Inicia sesión como usuario
3. Busca el ícono de campana (🔔) en la parte superior derecha
4. Haz clic en él

### Debería mostrar:
- ✅ Lista de notificaciones del usuario
- ✅ Contador de no leídas
- ✅ Opción de marcar como leída
- ✅ Opción de eliminar
- ✅ Opción de limpiar todas

### Si no aparece:
- Abre DevTools (F12) -> Console
- Verifica que no hay errores 404
- El error original era: `GET http://localhost:3000/api/notificaciones 404`
- Ahora debería ser: `GET http://localhost:3000/api/notificaciones 200`

---

## 🎯 Test 9: Integración con Otros Servicios

### Test - Envío de Email de Bienvenida

Cuando un nuevo usuario es creado, debe recibir un email de bienvenida.

```bash
# Crear usuario (esto dispara un email de bienvenida)
curl -X POST http://localhost:3001/api/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "New User",
    "correo": "newuser@example.com",
    "password": "SecurePass123!",
    "empresaId": "empresa_id"
  }'
```

### Verificación:
- Revisar `newuser@example.com` para recibir email de bienvenida
- Logs deben mostrar: `📧 Correo enviado a newuser@example.com`

---

## 📊 Checklist de Prueba Completa

- [ ] Test 1: Servicio está activo (GET /health → 200)
- [ ] Test 2: Obtener token válido
- [ ] Test 3: Listar notificaciones (GET /api/notificaciones → 200)
- [ ] Test 4: Marcar todas como leídas (PATCH /leer-todas → 200)
- [ ] Test 5: Enviar email del sistema (POST /system-email → 200)
- [ ] Test 6: Contar no leídas (GET /no-leidas/count → 200)
- [ ] Test 7: Marcar una como leída (PATCH /:id/leer → 200)
- [ ] Test 8: Frontend Notifications Menu funciona
- [ ] Test 9: Email de bienvenida se envía al crear usuario
- [ ] Test 10: No hay errores 404 en Console

---

## 🔍 Debugging

### Ver logs del servicio:
```bash
cd backend/notificaciones-svc
npm run dev
# Buscar líneas con 📧, ✅, ❌
```

### Ver solicitudes HTTP:
```bash
# En DevTools -> Network
# Filtrar por "notificaciones"
# Verificar que status es 200, 201, etc.
```

### Conectar a MongoDB:
```bash
mongosh
> use aurontek_notificaciones
> db.notificacions.find()  # Ver todas las notificaciones
> db.notificacions.countDocuments()  # Contar
```

### Verificar variables de entorno:
```bash
# En notificaciones-svc/.env
cat .env | grep RESEND
cat .env | grep SERVICE_TOKEN
```

---

## 📝 Reporte de Resultados

Después de completar todas las pruebas, crea un reporte:

```markdown
## Prueba del Servicio de Notificaciones - Fecha: 2025-01-11

### Status
- [x] Test 1: Health Check
- [x] Test 2: Token
- [x] Test 3: GET Notificaciones
- [x] Test 4: PATCH Leer Todas
- [x] Test 5: POST System Email
- [x] Test 6: GET Count
- [x] Test 7: PATCH Individual
- [x] Test 8: Frontend
- [x] Test 9: Integración
- [x] Test 10: Errores

### Conclusión
✅ Todas las pruebas pasaron correctamente.
El servicio de notificaciones funciona como se esperaba.
```

---

## ⚡ Solución Rápida de Problemas

| Problema | Solución Rápida |
|----------|-----------------|
| Error 404 | `app.use('/api/notificaciones', ...)` en `index.ts` |
| Error 401 | Obtener token válido con `localStorage.getItem('token')` |
| Email no llega | Verificar `RESEND_API_KEY` es válido |
| Notificaciones vacías | Crear notificación en MongoDB con mongosh |
| Leer-todas no funciona | Verificar que route está ANTES de `/:id/leer` |

