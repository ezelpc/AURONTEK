# 📋 Endpoints del Servicio de Notificaciones (Corregido)

## Base URL
```
http://localhost:3004/api/notificaciones  (desarrollo)
http://notificaciones-svc:3004/api/notificaciones  (docker)
```

---

## Endpoints Públicos (requieren JWT)

### 1. GET - Listar Notificaciones
```http
GET /api/notificaciones
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `leida` (boolean, opcional): Filtrar por estado de lectura
- `limite` (number, default: 20): Límite de notificaciones

**Response (200):**
```json
[
  {
    "_id": "123abc",
    "usuarioId": "456def",
    "titulo": "Nuevo Ticket",
    "mensaje": "Tu ticket fue creado",
    "tipo": "info|warning|success|error",
    "leida": false,
    "metadata": { "ticketId": "789" },
    "createdAt": "2025-01-11T10:30:00Z"
  }
]
```

---

### 2. PATCH - Marcar como Leída
```http
PATCH /api/notificaciones/:id/leer
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "_id": "123abc",
  "usuarioId": "456def",
  "titulo": "Nuevo Ticket",
  "leida": true,
  "createdAt": "2025-01-11T10:30:00Z"
}
```

---

### 3. PATCH - Marcar Todas como Leídas
```http
PATCH /api/notificaciones/leer-todas
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "msg": "Todas marcadas como leídas"
}
```

---

### 4. DELETE - Eliminar Notificación
```http
DELETE /api/notificaciones/:id
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "msg": "Eliminada"
}
```

---

### 5. DELETE - Eliminar Todas las Notificaciones
```http
DELETE /api/notificaciones/
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "msg": "Todas las notificaciones eliminadas",
  "eliminadas": 5
}
```

---

### 6. GET - Contar No Leídas
```http
GET /api/notificaciones/no-leidas/count
Authorization: Bearer <TOKEN>
```

**Response (200):**
```json
{
  "count": 3
}
```

---

## Endpoints Internos (requieren SERVICE_TOKEN)

### 7. POST - Enviar Email del Sistema
```http
POST /api/notificaciones/system-email
Content-Type: application/json

{
  "to": "usuario@example.com",
  "subject": "Asunto del Email",
  "html": "<h1>HTML Content</h1>",
  "text": "Plain text fallback"
}
```

**Autenticación (una de estas opciones):**

Opción A: Bearer Token
```
Authorization: Bearer <SERVICE_TOKEN>
```

Opción B: En el body
```json
{
  "to": "usuario@example.com",
  "subject": "Asunto",
  "html": "<h1>Contenido</h1>",
  "serviceToken": "<SERVICE_TOKEN>"
}
```

**Response (200):**
```json
{
  "msg": "Email enviado exitosamente",
  "to": "usuario@example.com",
  "subject": "Asunto del Email"
}
```

**Response (400):**
```json
{
  "msg": "Los campos \"to\" y \"subject\" son requeridos"
}
```

**Response (401):**
```json
{
  "msg": "Token de servicio inválido"
}
```

**Response (500):**
```json
{
  "msg": "Error al enviar email",
  "error": "Descripción del error"
}
```

---

## Uso desde Frontend

### Notificaciones Service
```typescript
// frontend/src/api/notificaciones.service.ts

export const notificacionesService = {
    // Obtener todas las notificaciones
    getAll: async (): Promise<Notification[]> => {
        const response = await api.get<Notification[]>('/notificaciones');
        return response.data;
    },

    // Marcar como leída
    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`/notificaciones/${id}/leer`);
    },

    // Marcar todas como leídas
    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notificaciones/leer-todas');
    },

    // Eliminar una notificación
    delete: async (id: string): Promise<void> => {
        await api.delete(`/notificaciones/${id}`);
    },

    // Eliminar todas
    deleteAll: async (): Promise<void> => {
        await api.delete('/notificaciones');
    },

    // Contar no leídas
    countUnread: async (): Promise<number> => {
        const response = await api.get<{ count: number }>('/notificaciones/no-leidas/count');
        return response.data.count;
    }
};
```

---

## Uso desde Backend (otros servicios)

### Usuarios Service - Enviar Email de Bienvenida
```typescript
// backend/usuarios-svc/src/Services/usuario.service.ts

const NOTIF_URL = process.env.NOTIFICACIONES_SERVICE_URL || 'http://notificaciones-svc:3004';

await axios.post(`${NOTIF_URL}/api/notificaciones/system-email`, {
    to: usuario.correo,
    subject: `Bienvenido a ${empresa.nombre} - Credenciales de Acceso`,
    html: `
        <h2>Bienvenido</h2>
        <p>Tu cuenta ha sido creada</p>
        <p><strong>Usuario:</strong> ${usuario.correo}</p>
        <p><strong>Contraseña:</strong> ${tempPassword}</p>
    `
});
```

### Tickets Service - Notificación de Ticket Creado
```typescript
// backend/tickets-svc/src/events/ticket.events.ts (vía RabbitMQ)

// El evento se publica automáticamente
// notificaciones-svc consume el evento y guarda la notificación en BD
```

---

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 404 Not Found | Ruta incorrecta | Usar `/api/notificaciones` en lugar de `/notificaciones` |
| 401 Unauthorized | Sin token o token inválido | Incluir `Authorization: Bearer <TOKEN>` |
| 500 Email Error | Resend no configurado | Verificar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` |
| No se envía email | SERVICE_TOKEN inválido | Verificar `SERVICE_TOKEN` en `.env` |

---

## Variables de Entorno Necesarias

```env
# notificaciones-svc/.env

# Base
NODE_ENV=development
NOTIFICATIONS_PORT=3004
MONGODB_URI=mongodb://localhost:27017/aurontek_notificaciones

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@aurontek.com

# Seguridad
SERVICE_TOKEN=token_secreto_para_servicios_internos
JWT_SECRET=tu_jwt_secret

# Integraciones
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
```

---

## Testing con cURL

### Listar notificaciones
```bash
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer eyJhbGc..."
```

### Enviar email (requiere SERVICE_TOKEN)
```bash
curl -X POST http://localhost:3000/api/notificaciones/system-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "usuario@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>",
    "serviceToken": "desarrollo"
  }'
```

### Marcar todas como leídas
```bash
curl -X PATCH http://localhost:3000/api/notificaciones/leer-todas \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Status de Implementación

✅ Listar notificaciones por usuario  
✅ Marcar como leída (individual)  
✅ Marcar todas como leídas  
✅ Eliminar notificación  
✅ Eliminar todas las notificaciones  
✅ Contar no leídas  
✅ Enviar emails del sistema  
✅ Integración con RabbitMQ (events)  
✅ Integración con Redis (pub/sub)  
⏳ Preferencias de notificación (mock)  

