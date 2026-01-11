# INSTRUCCIONES URGENTES: Ver Logs Completos

## Problema Identificado

El comando que tienes corriendo filtra SOLO errores, por eso no ves los logs de diagnóstico:

```powershell
npm run dev 2>&1 | Select-String -Pattern "error|Error|ERROR"
```

## Solución Inmediata

### Terminal 1: Tickets-svc (SIN FILTROS)

1. **Detén** el comando actual (Ctrl+C)
2. **Ejecuta SIN filtros:**
```bash
cd backend\tickets-svc
npm run dev
```

3. **Deja esta terminal visible** - aquí verás TODOS los logs

### Terminal 2: IA-svc  

```bash
cd backend\ia-svc
python -m uvicorn main:app --reload --port 3005
```

### Terminal 3: Gateway (opcional, ya está corriendo)

Si quieres ver sus logs también, corre:
```bash
cd backend\gateway-svc
npm run dev
```

## Qué Verás Ahora

Cuando crees un ticket, verás en **Terminal 1 (tickets-svc)**:

```
📍 [ROUTE] POST /tickets - Petición recibida en router
═══════════════════════════════════════════
🎫 [CONTROLLER] Petición de creación recibida
   Usuario: Nombre
   Body keys: ['titulo', 'descripcion', ...]
═══════════════════════════════════════════
[SERVICE] Buscando datos del servicio: 123...
[SERVICE] ✅ Servicio encontrado: Nombre
[SERVICE]    Grupo de atención: Mesa de Servicio
═══════════════════════════════════════════
[RABBITMQ] 📤 Preparando publicación de evento
   Routing Key: ticket.creado
   Ticket ID: 678...
═══════════════════════════════════════════
📤 [RabbitMQ] Publicando 'ticket.creado' (XXX bytes)
✅ [RabbitMQ] Publicado 'ticket.creado'
```

Y en **Terminal 2 (ia-svc)**:

```
═══════════════════════════════════════════
📨 [RABBITMQ-IA] Mensaje recibido!
   Routing Key: ticket.creado
   Ticket ID: 678...
═══════════════════════════════════════════
🎫 NUEVO TICKET RECIBIDO
```

## Después de Ver Los Logs

Una vez que veas los logs completos, cópiamelos para identificar dónde falla el flujo.
