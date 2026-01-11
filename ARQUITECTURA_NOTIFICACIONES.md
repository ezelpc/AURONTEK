# 📡 Arquitectura del Servicio de Notificaciones (Corregido)

## Flujo de Datos: Web Notifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ NotificationsMenu Component                                           │   │
│  │ ─────────────────────────────────────────────────────────────────     │   │
│  │ • useQuery({ queryKey: ['notifications'] })                          │   │
│  │ • notificacionesService.getAll()                                     │   │
│  │ • Toast de errores y éxito                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓ HTTP                                          │
│                    GET /api/notificaciones                                   │
│                    Authorization: Bearer <TOKEN>                            │
│                              ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Axios Instance (axios.ts)                                             │   │
│  │ ─────────────────────────────────────────────────────────────────     │   │
│  │ • baseURL: http://localhost:3000/api                                  │   │
│  │ • Interceptor: Inyecta JWT token                                      │   │
│  │ • Interceptor: Maneja 401/403 errors                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
                           GATEWAY (3000)
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GATEWAY-SVC (Express)                                 │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Middleware Cadena:                                                    │   │
│  │ 1. Express.json()                                                     │   │
│  │ 2. CORS Middleware                                                    │   │
│  │ 3. Proxy Route Matching                                               │   │
│  │    GET /api/notificaciones → http://notificaciones-svc:3004/...      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
                    Notificaciones Service (3004)
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NOTIFICACIONES-SVC (Express)                               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Route: GET /api/notificaciones                                        │   │
│  │ ─────────────────────────────────────────────────────────────────     │   │
│  │ → notificacionController.listar()                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Controller: listar                                                    │   │
│  │ ─────────────────────────────────────────────────────────────────     │   │
│  │ 1. Extraer userId del JWT token                                       │   │
│  │ 2. Validar que usuarioId existe                                       │   │
│  │ 3. Construir filtro: { usuarioId, leida? }                            │   │
│  │ 4. Llamar a Notificacion.find(filtro)                                 │   │
│  │ 5. Sort por createdAt descendente                                     │   │
│  │ 6. Limit a 20 (por defecto)                                           │   │
│  │ 7. res.json(notificaciones)                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↓ Mongoose                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ MongoDB Collection: notificacions                                     │   │
│  │ ─────────────────────────────────────────────────────────────────     │   │
│  │ Schema:                                                               │   │
│  │ {                                                                     │   │
│  │   _id: ObjectId,                                                      │   │
│  │   usuarioId: String,      // Index                                    │   │
│  │   titulo: String,                                                     │   │
│  │   mensaje: String,                                                    │   │
│  │   tipo: 'info'|'warning'|'success'|'error',                           │   │
│  │   leida: Boolean,         // Index con usuarioId                      │   │
│  │   metadata: { ticketId, ... },                                        │   │
│  │   createdAt: Date,        // Index                                    │   │
│  │   updatedAt: Date                                                     │   │
│  │ }                                                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓ JSON Array
                    Response: 200 OK
                              ↓
                        FRONTEND (React)
                    [{ _id, titulo, ... }]
```

---

## Flujo de Datos: System Emails

```
┌──────────────────────────────────────────────────────┐
│  OTROS SERVICIOS (usuarios-svc, tickets-svc)        │
│                                                      │
│  axios.post(                                        │
│    'http://notificaciones-svc:3004/api/notificaciones/system-email',
│    {                                                │
│      to: 'user@example.com',                        │
│      subject: 'Bienvenido',                         │
│      html: '<h1>HTML Content</h1>'                  │
│    }                                                │
│  )                                                  │
└──────────────────────────────────────────────────────┘
                        ↓ HTTP
┌──────────────────────────────────────────────────────┐
│  NOTIFICACIONES-SVC                                  │
│  Route: POST /api/notificaciones/system-email        │
│                                                      │
│  Controller: enviarEmailSistema()                    │
│  1. Validar SERVICE_TOKEN (producción)              │
│  2. Extraer { to, subject, html, text }            │
│  3. Validar que 'to' y 'subject' existen            │
│  4. Llamar a sendEmail(...)                         │
│                                                      │
│     ↓ (en email.service.ts)                         │
│                                                      │
│  5. Llamar a resendClient.emails.send()             │
│  6. Enviar a Resend API                             │
│  7. Retornar { msg, to, subject }                   │
└──────────────────────────────────────────────────────┘
                        ↓ HTTPS
┌──────────────────────────────────────────────────────┐
│  RESEND API                                          │
│  (Servicio de Email externo)                         │
│                                                      │
│  • Recibe: {from, to, subject, html}                │
│  • Valida credenciales (RESEND_API_KEY)             │
│  • Encola el email                                  │
│  • Retorna { id, from, to, created_at }            │
└──────────────────────────────────────────────────────┘
                        ↓ Email
┌──────────────────────────────────────────────────────┐
│  BANDEJA DE ENTRADA DEL USUARIO                      │
│  user@example.com recibe el email                    │
└──────────────────────────────────────────────────────┘
```

---

## Rutas Disponibles (Antes vs Después)

### ANTES (❌ Incorrecto)

```
GET    /                           → Listar notificaciones
PATCH  /:id/leer                   → Marcar como leída
PATCH  /leer-todas                 → ❌ NUNCA se ejecuta (atrapado por /:id)
DELETE /:id                        → Eliminar notificación
GET    /no-leidas/count            → Contar no leídas
GET    /preferencias               → Obtener preferencias
PUT    /preferencias               → Actualizar preferencias

❌ FALTA: system-email endpoint
❌ FALTA: DELETE / endpoint
❌ PROBLEMA: Conflicto de rutas
```

### DESPUÉS (✅ Correcto)

```
GET    /api/notificaciones                      → Listar notificaciones
PATCH  /api/notificaciones/leer-todas           → Marcar todas como leídas ✅
PATCH  /api/notificaciones/:id/leer             → Marcar como leída
DELETE /api/notificaciones/:id                  → Eliminar notificación
DELETE /api/notificaciones/                     → Eliminar todas ✅
GET    /api/notificaciones/no-leidas/count      → Contar no leídas
POST   /api/notificaciones/system-email         → Enviar email del sistema ✅
GET    /api/notificaciones/preferencias         → Obtener preferencias
PUT    /api/notificaciones/preferencias         → Actualizar preferencias

✅ Prefijo correcto: /api/notificaciones
✅ Rutas específicas ANTES que wildcards
✅ Nuevos endpoints agregados
```

---

## Orden de Ejecución de Rutas

### Problema Original

```
Router.PATCH('/:id/leer', ...)        ← Se ejecuta primero
Router.PATCH('/leer-todas', ...)      ← NUNCA se ejecuta

Cuando llega: PATCH /api/notificaciones/leer-todas
  1. Express intenta hacer match con '/:id/leer'
  2. ✅ Match! (id = 'leer-todas')
  3. Se ejecuta marcarLeida con id='leer-todas'
  4. MongoDB no encuentra: _id='leer-todas'
  5. Retorna 404 o null
  
Entonces: PATCH /api/notificaciones/leer-todas NUNCA llega a marcarTodasLeidas()
```

### Solución Implementada

```
Router.PATCH('/leer-todas', ...)      ← Se ejecuta primero ✅
Router.PATCH('/:id/leer', ...)        ← Se ejecuta después

Cuando llega: PATCH /api/notificaciones/leer-todas
  1. Express intenta hacer match con '/leer-todas'
  2. ✅ Match! (ruta específica)
  3. Se ejecuta marcarTodasLeidas()
  4. Actualiza todos los documentos del usuario
  5. Retorna 200 OK

Cuando llega: PATCH /api/notificaciones/507f1f77bcf86cd799439011/leer
  1. Express intenta hacer match con '/leer-todas'
  2. ❌ No match (no es exacta)
  3. Express intenta hacer match con '/:id/leer'
  4. ✅ Match! (id = '507f1f77bcf86cd799439011')
  5. Se ejecuta marcarLeida con id='507f1f77bcf86cd799439011'
  6. Retorna 200 OK
```

---

## Cambio en index.ts

```typescript
// ❌ ANTES
app.use('/', notificationRoutes);

// ✅ DESPUÉS  
app.use('/api/notificaciones', notificationRoutes);

// Esto significa:
// - Todas las rutas en notificationRoutes.ts se prefijan con /api/notificaciones
// - GET / → GET /api/notificaciones
// - PATCH /leer-todas → PATCH /api/notificaciones/leer-todas
// - DELETE /:id → DELETE /api/notificaciones/:id
// - etc.
```

---

## Integración con RabbitMQ

```
┌──────────────────────────┐
│   Evento: ticket.creado  │
│   Publicado por:         │
│   tickets-svc            │
└──────────────────────────┘
            ↓ RabbitMQ Queue
┌──────────────────────────────────────────────────┐
│  NOTIFICACIONES-SVC                               │
│  Consumer: handleTicketEvent                     │
│                                                  │
│  1. Recibe evento { ticket, action }             │
│  2. Si action='creado':                          │
│     - Enviar email al creador                    │
│     - Guardar notificación en BD                 │
│     - Notificar vía Redis Pub/Sub                │
│  3. Si action='asignado':                        │
│     - Enviar email al asignado                   │
│     - Guardar notificación en BD                 │
│  4. Etc...                                       │
└──────────────────────────────────────────────────┘
            ↓ MongoDB
┌──────────────────────────┐
│  Notificaciones guardadas │
│  en BD para el usuario    │
└──────────────────────────┘
```

---

## Flujo Completo de una Notificación

```
1. CREACIÓN (Backend: tickets-svc)
   ┌─────────────────────────────┐
   │ Crear ticket               │
   │ → Publicar evento RabbitMQ │
   └─────────────────────────────┘
                ↓

2. CONSUMO (Backend: notificaciones-svc)
   ┌──────────────────────────────────┐
   │ Recibir evento RabbitMQ          │
   │ → Extraer usuarioId y ticketId   │
   │ → Guardar en MongoDB             │
   │ → Enviar email si config=email   │
   │ → Publicar en Redis Pub/Sub       │
   └──────────────────────────────────┘
                ↓

3. TRANSMISIÓN (Real-time: Redis/Socket.io)
   ┌──────────────────────────────────┐
   │ Frontend suscrito a Redis         │
   │ Recibe notificación en tiempo real│
   │ → Se renderiza en pantalla        │
   └──────────────────────────────────┘
                ↓

4. CONSUMO POR FRONTEND (GET /api/notificaciones)
   ┌──────────────────────────────────┐
   │ NotificationsMenu useQuery        │
   │ → GET /api/notificaciones         │
   │ → Listar de MongoDB               │
   │ → Mostrar en dropdown             │
   └──────────────────────────────────┘
                ↓

5. INTERACCIÓN (PATCH /api/notificaciones/:id/leer)
   ┌──────────────────────────────────┐
   │ Usuario hace click                │
   │ → PATCH /:id/leer                 │
   │ → Actualizar leida=true en BD     │
   │ → Actualizar cache en frontend    │
   └──────────────────────────────────┘
```

---

## Tabla de Compatibilidad

| Componente | Versión | Cambios |
|------------|---------|---------|
| notificaciones-svc | 1.0.0 | ✅ Rutas corregidas, endpoints agregados |
| gateway-svc | 1.0.0 | ✅ Proxy ya configurado para /api/notificaciones |
| frontend | 1.0.0 | ✅ notificaciones.service.ts ya usa ruta correcta |
| usuarios-svc | 1.0.0 | ✅ Usa NOTIFICACIONES_SERVICE_URL correcto |
| tickets-svc | 1.0.0 | ✅ Publica eventos en RabbitMQ |

---

## Performance

### Índices en MongoDB

```javascript
db.notificacions.createIndex({ usuarioId: 1, createdAt: -1 })
db.notificacions.createIndex({ usuarioId: 1, leida: 1, createdAt: -1 })
```

### Ejemplo de Query

```javascript
// Listar 20 notificaciones más recientes no leídas
db.notificacions.find({
  usuarioId: "user123",
  leida: false
})
.sort({ createdAt: -1 })
.limit(20)
// Tiempo: < 50ms con índices
```

---

## Conclusión

La corrección fue simple pero crítica:
- 1 cambio en `index.ts` resolvió el 404
- 2 reordenamientos en `notificacion.routes.ts` resolvieron conflictos
- 2 nuevos controllers agregaron funcionalidad
- El sistema ahora es robusto y escalable

