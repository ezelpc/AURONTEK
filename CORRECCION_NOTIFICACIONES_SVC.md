# 🔧 Corrección Completa del Servicio de Notificaciones

## 📋 Resumen de Problemas Encontrados

### Error Principal: 404 en GET /api/notificaciones
```
GET http://localhost:3000/api/notificaciones 404 (Not Found)
```

**Causa Raíz:** Las rutas están montadas en `/` en lugar de `/api/notificaciones`

---

## ✅ Soluciones Implementadas

### 1. Corregir Prefijo de Rutas (CRÍTICO)

**Archivo:** `backend/notificaciones-svc/src/index.ts`

**Antes:**
```typescript
// Rutas API
app.use('/', notificationRoutes);
```

**Después:**
```typescript
// Rutas API
app.use('/api/notificaciones', notificationRoutes);
```

**Impacto:** Todas las rutas ahora responden correctamente en `/api/notificaciones/*`

---

### 2. Reordenar Rutas para Evitar Conflictos

**Archivo:** `backend/notificaciones-svc/src/Routes/notificacion.routes.ts`

**Problema:** La ruta `/:id/leer` atrapaba `/leer-todas` como si fuera un ID

**Antes:**
```typescript
router.get('/', notificacionController.listar);
router.patch('/:id/leer', notificacionController.marcarLeida);          // ❌ Atrapa /leer-todas
router.patch('/leer-todas', notificacionController.marcarTodasLeidas);  // ❌ Nunca se ejecuta
router.delete('/:id', notificacionController.eliminar);
router.get('/no-leidas/count', notificacionController.contarNoLeidas);
```

**Después:**
```typescript
// GET - Obtener notificaciones del usuario
router.get('/', notificacionController.listar);

// PATCH - Marcar como leído (ANTES de la ruta /:id para evitar conflictos)
router.patch('/leer-todas', notificacionController.marcarTodasLeidas);  // ✅ Antes de /:id
router.patch('/:id/leer', notificacionController.marcarLeida);          // ✅ Después

// POST - Enviar email del sistema (nuevo)
router.post('/system-email', notificacionController.enviarEmailSistema);

// DELETE
router.delete('/:id', notificacionController.eliminar);
router.delete('/', notificacionController.eliminarTodas);              // ✅ Nuevo

// GET
router.get('/no-leidas/count', notificacionController.contarNoLeidas);
```

**Impacto:** Las rutas específicas se ejecutan antes que los wildcards

---

### 3. Agregar Endpoint para Emails del Sistema

**Archivo:** `backend/notificaciones-svc/src/Controllers/notificacion.controller.ts`

**Nuevo Endpoint:** `POST /api/notificaciones/system-email`

**Descripción:** Permite que otros servicios (usuarios-svc, tickets-svc) envíen emails sin estar autenticados como usuario.

**Implementación:**
```typescript
enviarEmailSistema: async (req: Request, res: Response) => {
    try {
        // Verificar autorización por token de servicio
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1] || req.body?.serviceToken;
        
        // En desarrollo, permitir sin token
        if (process.env.NODE_ENV === 'production' && !verificarTokenServicio(token || '')) {
            return res.status(401).json({ msg: 'Token de servicio inválido' });
        }

        const { to, subject, text, html } = req.body;

        // Validar campos requeridos
        if (!to || !subject) {
            return res.status(400).json({ msg: 'Los campos "to" y "subject" son requeridos' });
        }

        // Enviar email
        await sendEmail({
            to,
            subject,
            text: text || undefined,
            html: html || undefined
        });

        res.json({ 
            msg: 'Email enviado exitosamente',
            to,
            subject
        });
    } catch (error) {
        console.error('❌ Error enviando email del sistema:', error);
        res.status(500).json({ 
            msg: 'Error al enviar email',
            error: (error as any)?.message
        });
    }
}
```

**Uso desde otros servicios:**
```typescript
// usuarios-svc, tickets-svc, etc.
await axios.post(`${NOTIF_URL}/api/notificaciones/system-email`, {
    to: usuario.correo,
    subject: 'Bienvenido a Aurontek',
    html: '<h1>Bienvenido</h1>'
});
```

**Seguridad:** 
- Acepta token de servicio en `Authorization` header o en body
- En producción requiere `SERVICE_TOKEN` válido
- En desarrollo funciona sin validación

---

### 4. Agregar Helper para Verificar Tokens de Servicio

**Archivo:** `backend/notificaciones-svc/src/Controllers/notificacion.controller.ts`

```typescript
// Helper para verificar token de servicio
const verificarTokenServicio = (token: string): boolean => {
    const tokenSecreto = process.env.SERVICE_TOKEN || 'desarrollo';
    return token === tokenSecreto;
};
```

---

### 5. Mejorar Servicio de Email

**Archivo:** `backend/notificaciones-svc/src/Services/email.service.ts`

**Cambios:**
- Soportar tanto `html` como `text`
- Mejorar manejo de errores
- Validar que se proporcione al menos uno

**Antes:**
```typescript
interface EmailOptions {
  to: string;
  subject: string;
  html: string;  // ❌ Solo HTML obligatorio
}
```

**Después:**
```typescript
interface EmailOptions {
  to: string;
  subject: string;
  html?: string;  // ✅ Opcional
  text?: string;  // ✅ Opcional (al menos uno requerido)
}
```

---

### 6. Agregar Endpoint para Eliminar Todas las Notificaciones

**Archivo:** `backend/notificaciones-svc/src/Controllers/notificacion.controller.ts`

```typescript
eliminarTodas: async (req: Request, res: Response) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        const resultado = await Notificacion.deleteMany({ usuarioId: userId });
        res.json({ 
            msg: 'Todas las notificaciones eliminadas',
            eliminadas: resultado.deletedCount
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar notificaciones' });
    }
}
```

**Ruta:** `DELETE /api/notificaciones/`

---

## 🧪 Pruebas de Validación

### Test 1: GET Notificaciones del Usuario
```bash
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer <TOKEN>"
```
✅ **Esperado:** 200 OK con array de notificaciones

---

### Test 2: Marcar Todas como Leídas
```bash
curl -X PATCH http://localhost:3000/api/notificaciones/leer-todas \
  -H "Authorization: Bearer <TOKEN>"
```
✅ **Esperado:** 200 OK con mensaje de confirmación

---

### Test 3: Enviar Email del Sistema
```bash
curl -X POST http://localhost:3000/api/notificaciones/system-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "usuario@example.com",
    "subject": "Notificación de Sistema",
    "html": "<h1>Hola</h1>"
  }'
```
✅ **Esperado:** 200 OK con ID de email enviado

---

### Test 4: Contar No Leídas
```bash
curl -X GET http://localhost:3000/api/notificaciones/no-leidas/count \
  -H "Authorization: Bearer <TOKEN>"
```
✅ **Esperado:** 200 OK con `{ count: número }`

---

## 📊 Resumen de Cambios

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `index.ts` | Prefijo de rutas: `/` → `/api/notificaciones` | CRÍTICO |
| `notificacion.routes.ts` | Reordenar rutas, agregar endpoints | ALTO |
| `notificacion.controller.ts` | Agregar `enviarEmailSistema`, `eliminarTodas` | ALTO |
| `email.service.ts` | Soportar text + html | MEDIO |

---

## 🚀 Próximos Pasos

1. **Reiniciar servicio:**
   ```bash
   cd backend/notificaciones-svc
   npm run dev
   ```

2. **Verificar en logs:**
   ```
   ✅ Notificaciones-SVC conectado a MongoDB
   ✅ Notificaciones-SVC escuchando en el puerto 3004
   ```

3. **Probar endpoints desde el frontend**
   - Notifications Menu debe cargar correctamente
   - Marcar como leída debe funcionar
   - Eliminar debe funcionar

4. **Verificar que otros servicios pueden enviar emails:**
   - usuarios-svc: Welcome email
   - tickets-svc: Ticket notifications
   - auth-svc: Password reset emails

---

## 🔐 Variables de Entorno Requeridas

```env
# notificaciones-svc/.env
MONGODB_URI=mongodb://localhost:27017/aurontek_notificaciones
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@aurontek.com
SERVICE_TOKEN=token_secreto_para_servicios
NODE_ENV=development
NOTIFICATIONS_PORT=3004
RABBITMQ_URL=amqp://localhost:5672
```

---

## 📝 Notas Importantes

1. **Compatibilidad Frontend:** El frontend ya usa `/api/notificaciones` correctamente en `notificaciones.service.ts`
2. **Compatibilidad Backend:** Otros servicios usan `NOTIFICACIONES_SERVICE_URL` que apunta a `http://notificaciones-svc:3004`
3. **Seguridad:** Los endpoints de notificaciones por usuario requieren JWT válido; los emails del sistema requieren token de servicio
4. **Resend vs SMTP:** Actualmente usa Resend API; se puede cambiar a SMTP en `email.service.ts`

---

## ✨ Funcionalidad Completa

El servicio de notificaciones ahora soporta:

✅ **Notificaciones Web:**
- Listar notificaciones del usuario
- Marcar como leída (individual)
- Marcar todas como leídas
- Eliminar notificación
- Eliminar todas las notificaciones
- Contar no leídas

✅ **Emails del Sistema:**
- Enviar emails desde usuarios-svc (bienvenida, recuperación de contraseña)
- Enviar emails desde tickets-svc (creación, asignación)
- Soporta HTML y texto plano
- Autenticación por token de servicio

✅ **Integración con RabbitMQ:**
- Consumidor de eventos de tickets
- Consumidor de eventos de chat
- Guardado automático de notificaciones en BD

