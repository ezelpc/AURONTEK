# 🚀 GUÍA RÁPIDA DE PRUEBA: Autoasignación de Tickets

## ✅ Estado Actual

Se han implementado las siguientes correcciones:

1. **Tickets-SVC**
   - ✅ Agregado flag `_ready` para sincronizar inicialización RabbitMQ
   - ✅ `publicarEvento()` espera hasta 10 segundos a que RabbitMQ esté listo
   - ✅ Mejorado logging con prefijo `[RabbitMQ]`

2. **IA-SVC**
   - ✅ Reescrito `rabbitmq_client.py` con mejor error handling
   - ✅ Agregado retry logic con backoff exponencial
   - ✅ Mejor manejo de SSL y desconexiones

---

## 🔧 PASO 1: Preparar Ambiente

### En terminal 1 - Tickets-SVC

```bash
cd backend/tickets-svc

# Limpiar build anterior
rm -rf dist node_modules/.cache

# Instalar dependencias (si es necesario)
npm install

# Ejecutar en modo desarrollo
npm run dev
```

**Esperar a ver:**
```
✅ [RabbitMQ] Conectado y listo
```

### En terminal 2 - IA-SVC

```bash
cd backend/ia-svc

# Ejecutar
python -m uvicorn main:app --reload --host 0.0.0.0 --port 3005
```

**Esperar a ver:**
```
✅ [RabbitMQ] Escuchando en cola: ia_tickets
```

---

## 🧪 PASO 2: Prueba Manual Simple

### Opción A: Usando el script de prueba (RECOMENDADO)

En terminal 3:

```bash
cd backend

# Ejecutar script de prueba
node test-ticket-ia-flow.js
```

**Debería mostrar:**
```
✅ Tickets-SVC: Disponible
✅ IA-SVC: Disponible
✅ Ticket creado exitosamente
✅ Ticket procesado por IA
✅ PRUEBA EXITOSA
```

---

### Opción B: Crear ticket manualmente

#### Paso 1: Crear ticket via API

**POST** `http://localhost:3002/api/tickets`

Headers:
```
Authorization: Bearer 23022e6bdb08ad3631c48af69253c5528f42cbed36b024b2fc041c0cfb23723b
X-Service-Name: test-script
Content-Type: application/json
```

Body:
```json
{
  "titulo": "Ticket de prueba",
  "descripcion": "Test de flujo IA",
  "empresaId": "empresa-test",
  "servicioId": "general",
  "servicioNombre": "General",
  "usuarioId": "usuario-test",
  "usuarioCreadorEmail": "test@test.com",
  "prioridad": "normal"
}
```

#### Paso 2: Verificar logs

**En terminal 1 (Tickets-SVC), deberías ver:**
```
✅ [RabbitMQ] Conectado y listo
📤 [RabbitMQ] Publicando 'ticket.creado' (XXX bytes)
✅ [RabbitMQ] Publicado 'ticket.creado'
```

**En terminal 2 (IA-SVC), deberías ver:**
```
✅ [RabbitMQ] Escuchando en cola: ia_tickets
📨 [RabbitMQ] Recibido: ticket.creado
🎫 NUEVO TICKET RECIBIDO
🔍 CLASIFICANDO TICKET...
   Tipo: [tipo]
   Prioridad: [prioridad]
👥 ASIGNANDO AGENTE...
✅ TICKET [ID] PROCESADO EXITOSAMENTE
```

---

## 📊 Checklist de Validación

- [ ] Ambos servicios se iniciaron sin errores
- [ ] Tickets-SVC muestra "✅ [RabbitMQ] Conectado y listo"
- [ ] IA-SVC muestra "✅ [RabbitMQ] Escuchando en cola"
- [ ] Al crear ticket, Tickets-SVC muestra "📤 [RabbitMQ] Publicando"
- [ ] IA-SVC muestra "📨 [RabbitMQ] Recibido"
- [ ] IA-SVC clasifica el ticket automáticamente
- [ ] IA-SVC asigna el ticket a un agente
- [ ] El ticket pasa a estado "en_proceso" o "asignado"

---

## 🐛 Solución de Problemas

### ❌ Tickets-SVC no se conecta a RabbitMQ

**Síntoma:** Ves "❌ [RabbitMQ] No se pudo conectar" repetidamente

**Solución:**
1. Verifica que RABBITMQ_URL esté definido en `.env`:
   ```bash
   echo $RABBITMQ_URL
   ```
2. La URL debe ser:
   ```
   amqps://qgvzngev:OIUIrM9ToP4TL-_zjpk1L_iYCZcTSWOr@leopard.lmq.cloudamqp.com/qgvzngev
   ```
3. Si RABBITMQ_URL no está definido, edita `backend/tickets-svc/.env` y agrega:
   ```
   RABBITMQ_URL=amqps://qgvzngev:OIUIrM9ToP4TL-_zjpk1L_iYCZcTSWOr@leopard.lmq.cloudamqp.com/qgvzngev
   ```
4. Reinicia tickets-svc

---

### ❌ IA-SVC no recibe tickets

**Síntoma:** Se crea ticket pero IA-SVC nunca muestra "📨 [RabbitMQ] Recibido"

**Solución:**
1. Verifica que RABBITMQ_URL esté definido en `backend/ia-svc/.env`
2. Verifica que IA-SVC muestre "✅ [RabbitMQ] Escuchando" en los logs al iniciar
3. Si no lo muestra:
   - Revisa si hay errores en los logs
   - Intenta reiniciar: Ctrl+C y vuelve a ejecutar
4. Verifica que Tickets-SVC esté publicando:
   - En tickets-svc deberías ver "✅ [RabbitMQ] Publicado 'ticket.creado'"

---

### ❌ RabbitMQ no está disponible

**Síntoma:** Ambos servicios muestran errores de conexión

**Verificar:**
1. Intenta conectarte a RabbitMQ directamente:
   ```python
   python backend/ia-svc/test_rabbitmq.py
   ```
   (rename de `test_rabbitmq.py.bak` si es necesario)

2. Si no puedes conectar, verifica:
   - ¿Estás conectado a internet?
   - ¿La URL es correcta?
   - ¿CloudAMQP está disponible? (https://www.cloudamqp.com/console)

---

### ⚠️ Ticket se crea pero no se asigna

**Síntoma:** Ticket está en estado "abierto" sin agente

**Probable causa:** IA-SVC está recibiendo pero hay error en clasificación/asignación

**Solución:**
1. Revisa los logs completos de IA-SVC
2. Busca mensaje de error como "❌ ERROR PROCESANDO TICKET"
3. Verifica que:
   - `usuarios-svc` está disponible (se necesita para obtener agentes)
   - `tickets-svc` está disponible (se necesita para actualizar ticket)
   - Los agentes tienen estado "disponible"

---

## 📝 Logs que Esperar (Flujo Completo)

```
=== CREAR TICKET ===
POST /api/tickets
→ 201 Created

=== TICKETS-SVC ===
✅ [RabbitMQ] Conectado y listo
📤 [RabbitMQ] Publicando 'ticket.creado' (XXX bytes)
✅ [RabbitMQ] Publicado 'ticket.creado'

=== IA-SVC (después de 1-2 segundos) ===
✅ [RabbitMQ] Escuchando en cola: ia_tickets
📨 [RabbitMQ] Recibido: ticket.creado

============================================================
🎫 NUEVO TICKET RECIBIDO
============================================================
📋 Ticket ID: [ID]
📝 Título: [Título]
🏢 Empresa ID: [ID]
🔧 Servicio: General
🔧 Grupos Recibidos: ['soporte']

🔍 CLASIFICANDO TICKET...
   Tipo: soporte
   Prioridad: normal
   Categoría: general
   Grupo de Atención: soporte
   SLA Resolución: 480 min

👥 ASIGNANDO AGENTE...
   Agente encontrado: [Nombre]
   Carga actual: X/10

============================================================
✅ TICKET [ID] PROCESADO EXITOSAMENTE
👤 Asignado a: [Nombre]
============================================================
```

---

## 🎯 Resumen

**Si ves todos estos logs en orden, la autoasignación funciona correctamente:**

1. ✅ Ticket-SVC conectado a RabbitMQ
2. ✅ IA-SVC escuchando en cola
3. 📤 Evento publicado por Tickets-SVC
4. 📨 Evento recibido por IA-SVC
5. 🎫 Ticket procesado y clasificado
6. 👥 Agente asignado automáticamente

**¡Autoasignación funcionando! 🎉**

---

## 📞 Siguiente Paso

Si todo funciona, puedes:
1. Revisar el ticket en el frontend → debe estar "asignado" a un agente
2. Revisar en MongoDB → debe tener `agenteAsignadoId` y `clasificacion`
3. Revisar en `usuarios-svc` → agente debe tener carga incrementada

