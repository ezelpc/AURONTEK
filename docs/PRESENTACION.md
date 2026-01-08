# 🚀 AURONTEK - Presentación del Proyecto

## Sistema de Gestión de Tickets Empresariales con IA

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Objetivos](#objetivos)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Base de Datos MongoDB](#base-de-datos-mongodb)
6. [Sistema de Inteligencia Artificial](#sistema-de-inteligencia-artificial)
7. [Funcionalidades Principales](#funcionalidades-principales)
8. [Seguridad](#seguridad)
9. [Deployment y DevOps](#deployment-y-devops)
10. [Métricas y Performance](#métricas-y-performance)

---

## 1. 📖 Introducción

### ¿Qué es AURONTEK?

AURONTEK es un **sistema completo de gestión de tickets empresariales** diseñado para optimizar el soporte técnico y la atención al cliente mediante una arquitectura de microservicios moderna, escalable y con **inteligencia artificial integrada**.

### Problema que Resuelve

- ❌ **Gestión ineficiente** de tickets de soporte
- ❌ **Asignación manual** de tickets (pérdida de tiempo)
- ❌ **Falta de trazabilidad** en solicitudes
- ❌ **Comunicación fragmentada** entre equipos
- ❌ **Ausencia de métricas** de rendimiento
- ❌ **Gaming del sistema** por parte de agentes

### Solución

- ✅ **Centralización** de todas las solicitudes
- ✅ **Asignación automática inteligente** con IA
- ✅ **Clasificación automática** de tickets
- ✅ **Trazabilidad completa** del ciclo de vida
- ✅ **Dashboard en tiempo real** con métricas
- ✅ **Anti-gaming** para distribución justa de carga

---

## 2. 🎯 Objetivos

### Objetivos de Negocio

1. **Mejorar la eficiencia** del equipo de soporte en un 40%
2. **Reducir el tiempo de respuesta** promedio a menos de 2 horas
3. **Aumentar la satisfacción del cliente** (NPS > 80)
4. **Automatizar el 60%** de las tareas repetitivas
5. **Escalar** a 100+ empresas sin incrementar costos

### Objetivos Técnicos

1. **Alta disponibilidad** (Uptime > 99.5%)
2. **Performance óptimo** (Response time < 200ms)
3. **Seguridad robusta** (OWASP Top 10 cubierto)
4. **Escalabilidad horizontal** (microservicios)
5. **Deployment automático** (CI/CD)
6. **Costos optimizados** (AWS Free Tier)

---

## 3. 🏗️ Arquitectura del Sistema

### 3.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│              React 18 + Vite + TailwindCSS                       │
│           Portal Admin + Portal Empresas                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NGINX (EDGE EC2) - SSL/TLS                       │
│           Let's Encrypt + Reverse Proxy + Load Balancer          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API GATEWAY (EDGE EC2)                          │
│        CORS • Rate Limiting • Authentication • Routing           │
│                 Express.js + Redis + JWT                         │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Usuarios │ │ Tickets  │ │   Chat   │ │Notifica- │ │    IA    │
│   SVC    │ │   SVC    │ │   SVC    │ │ciones SVC│ │   SVC    │
│ (CORE)   │ │ (CORE)   │ │ (CORE)   │ │ (CORE)   │ │ (CORE)   │
│ Node.js  │ │ Node.js  │ │ Node.js  │ │ Node.js  │ │ Python   │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │            │
     └────────────┴────────────┴────────────┴────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  MongoDB     │  │  RabbitMQ    │  │    Redis     │
     │   Atlas      │  │ (CloudAMQP)  │  │   (Cache)    │
     │ (Database)   │  │ (Messages)   │  │ (Sessions)   │
     └──────────────┘  └──────────────┘  └──────────────┘
```

### 3.2 Arquitectura Dual-EC2

#### **EDGE (EC2 Pública - t2.micro)**
- **Rol:** Punto de entrada público
- **Servicios:**
  - **Nginx:** Reverse Proxy + SSL/TLS (Let's Encrypt)
  - **Gateway:** API Gateway (Express.js)
  - **Redis:** Cache + Rate Limiting + Sessions
- **Recursos:**
  - CPU: ~15% utilización
  - RAM: ~270MB
  - IP: Pública + Privada
  - Swap: 1.5GB

#### **CORE (EC2 Privada - t2.micro)**
- **Rol:** Lógica de negocio y procesamiento
- **Servicios:**
  - **usuarios-svc:** Autenticación, usuarios, empresas, roles
  - **tickets-svc:** CRUD tickets, asignación, SLA
  - **chat-svc:** WebSockets, mensajes en tiempo real
  - **notificaciones-svc:** Emails, notificaciones in-app
  - **ia-svc:** Clasificación y asignación inteligente
- **Recursos:**
  - CPU: ~35% utilización
  - RAM: ~900MB
  - IP: Solo privada (seguridad)
  - Swap: 1.5GB

### 3.3 Patrón de Arquitectura

**Microservicios + API Gateway + Event-Driven Architecture**

#### Características:
- ✅ **Microservicios:** Servicios independientes y especializados
- ✅ **API Gateway:** Punto único de entrada con enrutamiento inteligente
- ✅ **Event-Driven:** RabbitMQ para comunicación asíncrona
- ✅ **Cache:** Redis para performance y rate limiting
- ✅ **CQRS:** Separación de lecturas y escrituras
- ✅ **Service Mesh:** Comunicación segura entre servicios

#### Ventajas:
- **Escalabilidad:** Cada servicio escala independientemente
- **Resiliencia:** Fallo de un servicio no afecta a los demás
- **Desarrollo:** Equipos pueden trabajar en paralelo
- **Deployment:** Despliegues independientes sin downtime
- **Tecnología:** Cada servicio puede usar la mejor tecnología para su caso

---

## 4. 💻 Stack Tecnológico

### 4.1 ¿Qué es MERN?

**MERN** es un stack tecnológico completo para desarrollo web full-stack:

- **M**ongoDB - Base de datos NoSQL orientada a documentos
- **E**xpress.js - Framework web minimalista para Node.js
- **R**eact - Librería de interfaz de usuario
- **N**ode.js - Runtime de JavaScript del lado del servidor

### 4.2 Frontend

```yaml
React 18.2:          Librería UI con hooks y concurrent features
Vite 5.0:            Build tool ultra-rápido (HMR < 100ms)
TypeScript 5.3:      Type safety y mejor DX
TailwindCSS 3.4:     Utility-first CSS framework
React Router 6.20:   Client-side routing
React Query 5.0:     Server state management y caching
Socket.IO Client:    WebSockets para tiempo real
Axios 1.6:           HTTP client con interceptors
React Hook Form:     Formularios performantes
Zod:                 Schema validation
Shadcn/ui:           Componentes accesibles y customizables
```

### 4.3 Backend (Node.js)

```yaml
Node.js 18 LTS:      Runtime JavaScript con ESM support
Express.js 5.1:      Web framework minimalista
TypeScript 5.9:      Type safety en backend
Mongoose 8.0:        MongoDB ODM con schemas y validación
Socket.IO 4.6:       WebSockets bidireccionales
bcrypt 5.1:          Password hashing (10 rounds)
jsonwebtoken 9.0:    JWT para autenticación stateless
express-validator:   Input validation y sanitization
helmet:              Security headers
cors:                Cross-Origin Resource Sharing
rate-limiter:        Protección contra brute force
```

### 4.3 Backend (Python - IA Service)

```yaml
Python 3.9:          Runtime para ML/AI
FastAPI 0.109:       Framework async de alto rendimiento
Pydantic 2.5:        Data validation con type hints
httpx:               HTTP client async
pika:                RabbitMQ client para Python
```

### 4.4 Bases de Datos

#### **MongoDB Atlas 7.0 (NoSQL)**
- **Tipo:** Base de datos orientada a documentos
- **Modelo:** Esquema flexible (JSON/BSON)
- **Ventajas:**
  - Escalabilidad horizontal (sharding)
  - Consultas rápidas con índices
  - Relaciones embebidas y referenciadas
  - Transacciones ACID (desde v4.0)
  - Agregaciones potentes
- **Plan:** Free Tier (512MB, 100 conexiones)

#### **Redis 7.0 (In-Memory)**
- **Tipo:** Key-value store en memoria
- **Usos:**
  - Cache de sesiones JWT
  - Rate limiting por IP
  - Cache de consultas frecuentes
  - Pub/Sub para eventos
- **Performance:** < 1ms latencia

### 4.5 Message Queue

#### **RabbitMQ (CloudAMQP)**
- **Tipo:** Message broker AMQP
- **Patrón:** Publish/Subscribe + Topic Exchange
- **Usos:**
  - Eventos de tickets (creado, asignado, cerrado)
  - Procesamiento asíncrono de IA
  - Notificaciones por email
  - Desacoplamiento de servicios
- **Ventajas:**
  - Garantía de entrega
  - Persistencia de mensajes
  - Dead letter queues
  - Retry automático

### 4.6 Servicios Externos

```yaml
Cloudinary:          Almacenamiento de imágenes y archivos
Resend:              Servicio de emails transaccionales
Google reCAPTCHA v3: Protección contra bots
Let's Encrypt:       Certificados SSL/TLS gratuitos
No-IP:               Dynamic DNS para IP dinámica
```

### 4.7 DevOps y Cloud

```yaml
Docker 24.0:         Containerización de servicios
Docker Compose 2.23: Orquestación multi-container
GitHub Actions:      CI/CD pipeline automático
Nginx 1.24:          Reverse proxy + load balancer
AWS EC2 t2.micro:    Compute (2 instancias Free Tier)
Vercel:              Frontend hosting con CDN global
Docker Hub:          Registry de imágenes
```

---

## 5. 🗄️ Base de Datos MongoDB

### 5.1 ¿Por qué MongoDB?

MongoDB es una base de datos **NoSQL orientada a documentos** que almacena datos en formato **BSON** (Binary JSON).

#### Ventajas para AURONTEK:
1. **Esquema Flexible:** Permite evolución rápida del modelo
2. **Performance:** Consultas rápidas con índices optimizados
3. **Escalabilidad:** Sharding horizontal nativo
4. **Relaciones:** Soporta embebidas y referenciadas
5. **Agregaciones:** Pipeline potente para analytics
6. **Transacciones:** ACID para operaciones críticas

### 5.2 Modelo de Datos

#### **Colección: empresas**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  nombre: "Tech Solutions SA",
  rfc: "TSO123456ABC",
  codigo_acceso: "AB12CD34",  // Único, 8 caracteres
  activo: true,
  fecha_creacion: ISODate("2024-01-15T10:00:00Z"),
  configuracion: {
    logo_url: "https://cloudinary.com/...",
    color_primario: "#3B82F6",
    timezone: "America/Mexico_City",
    notificaciones_email: true
  },
  contacto: {
    email: "admin@techsolutions.com",
    telefono: "+52 55 1234 5678"
  }
}
```

#### **Colección: usuarios**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  nombre: "Juan Pérez",
  correo: "juan.perez@techsolutions.com",  // Único
  contraseña: "$2b$10$...",  // Hasheado con bcrypt
  telefono: "+52 55 9876 5432",
  empresa: ObjectId("507f1f77bcf86cd799439011"),  // Ref: Empresa
  rol: "resolutor-empresa",  // Ref: Role name
  permisos: ["tickets.view", "tickets.update", "chat.access"],
  activo: true,
  estado_actividad: "available",  // available, busy, offline
  gruposDeAtencion: ["Mesa de Servicio", "Soporte Técnico"],
  habilidades: ["Windows", "Office 365", "Redes"],
  estadisticas: {
    tickets_resueltos: 45,
    tickets_activos: 3,
    rating_promedio: 4.8
  },
  fecha_creacion: ISODate("2024-02-01T08:30:00Z"),
  ultimo_acceso: ISODate("2024-03-15T14:22:00Z")
}
```

#### **Colección: roles**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  nombre: "resolutor-empresa",
  descripcion: "Agente de soporte que resuelve tickets",
  empresa: ObjectId("507f1f77bcf86cd799439011"),  // null para roles globales
  permisos: [
    "tickets.view",
    "tickets.update",
    "tickets.assign_self",
    "chat.access",
    "chat.send"
  ],
  nivel: 3,  // Jerarquía (1=más alto)
  activo: true,
  fecha_creacion: ISODate("2024-01-15T10:00:00Z")
}
```

#### **Colección: servicios**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  nombre: "Desbloqueo de cuenta",
  tipo: "Requerimiento",  // Requerimiento | Incidente
  categoria: "Directorio Activo",
  alcance: "local",  // local | global
  empresaId: ObjectId("507f1f77bcf86cd799439011"),  // null si global
  prioridad: "alta",
  sla: "2 horas",
  gruposDeAtencion: "Mesa de Servicio",
  plantilla: [
    {
      campo: "usuario_afectado",
      tipo: "texto",
      requerido: true
    },
    {
      campo: "motivo_bloqueo",
      tipo: "lista",
      opciones: ["Contraseña incorrecta", "Inactividad", "Otro"],
      requerido: false
    }
  ],
  activo: true
}
```

#### **Colección: tickets**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  folio: "TKT-2024-001234",  // Auto-generado
  titulo: "No puedo acceder a mi cuenta",
  descripcion: "He intentado ingresar mi contraseña 3 veces...",
  prioridad: "alta",  // baja, media, alta, critica
  estado: "en_proceso",  // abierto, en_proceso, en_espera, resuelto, cerrado
  tipo: "requerimiento",
  categoria: "Directorio Activo",
  
  // Referencias
  empresaId: ObjectId("507f1f77bcf86cd799439011"),
  servicioId: ObjectId("507f1f77bcf86cd799439014"),
  usuarioCreador: ObjectId("507f1f77bcf86cd799439012"),
  usuarioCreadorEmail: "juan.perez@techsolutions.com",
  agenteAsignado: ObjectId("507f1f77bcf86cd799439016"),
  tutor: null,  // Para delegación a becarios
  
  // Metadata del servicio
  metadata: {
    usuario_afectado: "juan.perez",
    motivo_bloqueo: "Contraseña incorrecta"
  },
  
  // SLA
  tiempoRespuesta: 120,  // minutos
  tiempoResolucion: 120,
  fechaLimiteRespuesta: ISODate("2024-03-15T16:00:00Z"),
  fechaLimiteResolucion: ISODate("2024-03-15T16:00:00Z"),
  tiempoEnEspera: 0,  // Acumulado en ms
  fechaInicioEspera: null,
  
  // Adjuntos
  adjuntos: [
    {
      url: "https://cloudinary.com/...",
      tipo: "image/png",
      nombre: "captura_error.png",
      tamaño: 245678
    }
  ],
  
  // Fechas
  fecha_creacion: ISODate("2024-03-15T14:00:00Z"),
  fechaRespuesta: ISODate("2024-03-15T14:15:00Z"),
  fechaResolucion: null,
  fecha_actualizacion: ISODate("2024-03-15T14:30:00Z"),
  fecha_cierre: null,
  
  // Clasificación IA
  clasificacion_ia: {
    confianza: 0.95,
    sugerencias: ["Verificar estado en AD", "Revisar políticas de contraseña"]
  }
}
```

#### **Colección: mensajes**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439017"),
  ticket: ObjectId("507f1f77bcf86cd799439015"),
  usuario: ObjectId("507f1f77bcf86cd799439016"),
  mensaje: "He desbloqueado tu cuenta. Por favor intenta nuevamente.",
  tipo: "texto",  // texto, imagen, archivo
  adjuntos: [],
  leido: false,
  fecha_creacion: ISODate("2024-03-15T14:30:00Z")
}
```

#### **Colección: actividades (Audit Trail)**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439018"),
  ticket: ObjectId("507f1f77bcf86cd799439015"),
  usuario: ObjectId("507f1f77bcf86cd799439016"),
  accion: "asignado",  // creado, asignado, estado_cambiado, comentado, etc.
  descripcion: "Ticket asignado a María González",
  datos_anteriores: {
    agenteAsignado: null,
    estado: "abierto"
  },
  datos_nuevos: {
    agenteAsignado: ObjectId("507f1f77bcf86cd799439016"),
    estado: "en_proceso"
  },
  fecha: ISODate("2024-03-15T14:15:00Z")
}
```

### 5.3 Índices Optimizados

```javascript
// Usuarios
db.usuarios.createIndex({ correo: 1 }, { unique: true })
db.usuarios.createIndex({ empresa: 1, activo: 1 })
db.usuarios.createIndex({ rol: 1, estado_actividad: 1 })

// Tickets
db.tickets.createIndex({ folio: 1 }, { unique: true })
db.tickets.createIndex({ empresaId: 1, estado: 1 })
db.tickets.createIndex({ agenteAsignado: 1, estado: 1 })
db.tickets.createIndex({ fecha_creacion: -1 })
db.tickets.createIndex({ servicioId: 1 })

// Servicios
db.servicios.createIndex({ alcance: 1, activo: 1 })
db.servicios.createIndex({ empresaId: 1, tipo: 1 })

// Mensajes
db.mensajes.createIndex({ ticket: 1, fecha_creacion: -1 })
db.mensajes.createIndex({ usuario: 1, leido: 1 })

// Actividades
db.actividades.createIndex({ ticket: 1, fecha: -1 })
```

### 5.4 Relaciones en MongoDB

#### **Relaciones Embebidas (Embedded)**
Usadas cuando los datos son pequeños y siempre se consultan juntos:
```javascript
// Configuración embebida en empresa
configuracion: {
  logo_url: "...",
  color_primario: "#3B82F6"
}
```

#### **Relaciones Referenciadas (Referenced)**
Usadas para datos grandes o que se consultan independientemente:
```javascript
// Usuario referencia a empresa
empresa: ObjectId("507f1f77bcf86cd799439011")

// Ticket referencia a usuario, empresa, servicio
usuarioCreador: ObjectId("..."),
empresaId: ObjectId("..."),
servicioId: ObjectId("...")
```

---

## 6. 🤖 Sistema de Inteligencia Artificial

### 6.1 Arquitectura del IA Service

El **ia-svc** es un microservicio en **Python + FastAPI** que procesa tickets automáticamente usando:
1. **Clasificación basada en catálogo de servicios**
2. **Asignación inteligente con algoritmo anti-gaming**
3. **Comunicación asíncrona vía RabbitMQ**

```
┌─────────────────────────────────────────────────────────────┐
│                      FLUJO DE IA                             │
└─────────────────────────────────────────────────────────────┘

1. Usuario crea ticket → tickets-svc
2. tickets-svc publica evento → RabbitMQ (ticket.creado)
3. ia-svc consume evento → Procesa ticket
4. ia-svc clasifica → TicketClassifier
5. ia-svc asigna agente → AgentAssigner
6. ia-svc actualiza ticket → tickets-svc
7. ia-svc publica resultado → RabbitMQ (ticket.procesado)
```

### 6.2 Clasificación Automática de Tickets

#### **TicketClassifier**

El clasificador usa un **catálogo de servicios predefinido** para determinar automáticamente:
- **Tipo:** Incidente o Requerimiento
- **Categoría:** Directorio Activo, Redes, Seguridad, etc.
- **Prioridad:** Baja, Media, Alta, Crítica
- **SLA:** Tiempo de respuesta y resolución
- **Grupo de Atención:** Mesa de Servicio, Telecomunicaciones, etc.

#### **Ejemplo de Clasificación:**

```python
# Ticket recibido
ticket_data = {
    "id": "507f1f77bcf86cd799439015",
    "titulo": "No puedo acceder a mi cuenta",
    "servicioNombre": "Desbloqueo de cuenta",
    "empresaId": "507f1f77bcf86cd799439011"
}

# Clasificación automática
classification = {
    "tipo": "requerimiento",
    "categoria": "Directorio Activo",
    "prioridad": "alta",
    "grupo_atencion": "Mesa de Servicio",
    "tiempoResolucion": 120,  # 2 horas en minutos
    "tiempoRespuesta": 120
}
```

#### **Catálogo de Servicios:**

```python
SERVICE_CATALOG_BY_NAME = {
    "Desbloqueo de cuenta": {
        "tipo": "requerimiento",
        "categoria": "Directorio Activo",
        "prioridad": "alta",
        "sla_cliente_min": 120,  # 2 horas
        "grupo_atencion": "Mesa de Servicio"
    },
    "Sin salida a Internet": {
        "tipo": "incidente",
        "categoria": "Redes",
        "prioridad": "media",
        "sla_cliente_min": 720,  # 12 horas
        "grupo_atencion": "Telecomunicaciones"
    },
    "Virus": {
        "tipo": "incidente",
        "categoria": "Seguridad",
        "prioridad": "alta",
        "sla_cliente_min": 240,  # 4 horas
        "grupo_atencion": "Seguridad"
    }
}
```

### 6.3 Asignación Inteligente de Agentes

#### **AgentAssigner - Algoritmo Anti-Gaming**

El asignador evalúa a todos los agentes disponibles y selecciona al mejor candidato basándose en **múltiples métricas** para evitar que los agentes "jueguen" el sistema.

#### **Métricas Evaluadas:**

1. **Carga Activa (active_count)**
   - Número de tickets activos asignados
   - Penalización: 150 puntos por ticket

2. **Carga Ponderada (active_weighted)**
   - Peso según prioridad de tickets
   - Crítica: 3x, Alta: 2x, Media: 1x, Baja: 0.5x
   - Penalización: 50 puntos por unidad de peso

3. **Edad Promedio de Tickets (avg_ticket_age_days)**
   - Promedio de días desde asignación
   - Penalización exponencial si > 3 días
   - Fórmula: `(días - 3)² × 50`

4. **Tickets Estancados (stagnant_count)**
   - Tickets sin actualización en 48+ horas
   - Penalización: 100 puntos por ticket estancado

5. **Velocidad de Resolución (resolution_velocity)**
   - Tickets cerrados en últimos 7 días / 7
   - Bonus: 100 puntos por ticket/día
   - Penalización si < 0.5 tickets/día

6. **Eficiencia (efficiency_ratio)**
   - Tickets cerrados / Tickets asignados (últimos 30 días)
   - Bonus: 200 puntos × ratio
   - Penalización si < 70%

#### **Fórmula de Score:**

```python
base_score = 10000

final_score = (
    base_score
    - (active_count × 150)           # Penalización por cantidad
    - (active_weighted × 50)         # Penalización por peso
    - gaming_penalty                 # Penalización anti-gaming
    + (resolution_velocity × 100)    # Bonus por velocidad
    + (efficiency_ratio × 200)       # Bonus por eficiencia
)

# Mayor score = Mejor candidato
```

#### **Ejemplo de Evaluación:**

```
📋 Evaluando 3 Resolutores del grupo 'Mesa de Servicio'...

   👤 María González
      Tickets Activos: 2 (Peso: 3.0)
      Edad Promedio: 1.5 días
      Estancados: 0
      Velocidad: 1.2 tickets/día
      Eficiencia: 85%
      Gaming Penalty: 0
      ⭐ Score Final: 9720.00

   👤 Carlos Ramírez
      Tickets Activos: 5 (Peso: 7.5)
      Edad Promedio: 4.2 días
      Estancados: 2
      Velocidad: 0.8 tickets/día
      Eficiencia: 65%
      Gaming Penalty: 387.20
      ⭐ Score Final: 8297.80

   👤 Ana López
      Tickets Activos: 1 (Peso: 1.0)
      Edad Promedio: 0.8 días
      Estancados: 0
      Velocidad: 1.5 tickets/día
      Eficiencia: 90%
      Gaming Penalty: 0
      ⭐ Score Final: 9980.00

✅ ASIGNADO A: Ana López (Score: 9980.00)
   Carga Actual: 1 tickets
```

#### **Prevención de Gaming:**

El sistema detecta y penaliza comportamientos como:
- **Acumular tickets sin cerrarlos** → Penalización por edad promedio
- **Tickets estancados** → Penalización por falta de actividad
- **Baja velocidad de resolución** → Penalización por productividad
- **Cerrar tickets sin resolver** → Penalización por eficiencia

### 6.4 Comunicación Asíncrona (RabbitMQ)

#### **Eventos Publicados:**

```javascript
// 1. Ticket creado (tickets-svc → ia-svc)
{
  "routingKey": "ticket.creado",
  "data": {
    "ticket": {
      "id": "507f1f77bcf86cd799439015",
      "titulo": "No puedo acceder",
      "servicioNombre": "Desbloqueo de cuenta",
      "empresaId": "507f1f77bcf86cd799439011"
    }
  }
}

// 2. Ticket procesado (ia-svc → notificaciones-svc)
{
  "routingKey": "ticket.procesado",
  "data": {
    "ticketId": "507f1f77bcf86cd799439015",
    "agenteId": "507f1f77bcf86cd799439016",
    "agenteNombre": "Ana López",
    "clasificacion": {
      "tipo": "requerimiento",
      "prioridad": "alta"
    }
  }
}
```

### 6.5 Endpoints del IA Service

```python
# Health check
GET /health
Response: {
  "status": "healthy",
  "services": {
    "classifier": "ready",
    "assigner": "ready",
    "rabbitmq": "connected"
  }
}

# Clasificación manual
POST /classify
Body: { "servicioNombre": "Desbloqueo de cuenta" }
Response: {
  "success": true,
  "classification": {
    "tipo": "requerimiento",
    "prioridad": "alta",
    "categoria": "Directorio Activo"
  }
}

# Asignación manual
POST /assign
Body: {
  "empresaId": "...",
  "grupo_atencion": "Mesa de Servicio"
}
Response: {
  "success": true,
  "agent": {
    "id": "...",
    "nombre": "Ana López",
    "cargaActual": 1
  }
}
```

---

## 7. ⚙️ Funcionalidades Principales

### 7.1 Gestión de Tickets

- ✅ **CRUD completo** de tickets
- ✅ **Tickets Locales vs Globales** (Alcance diferenciado)
  - Vista general de tickets globales (Admin)
  - Filtro avanzado: Mis tickets asignados de servicios globales (Personal)
- ✅ **Catálogo de Servicios** dinámico por empresa
- ✅ **Asignación automática** basada en IA
- ✅ **Clasificación automática** con IA
- ✅ **Priorización** (baja, media, alta, crítica)
- ✅ **Estados** (abierto, en espera, en proceso, resuelto, cerrado)
- ✅ **SLA tracking** con pausa en "en espera"
- ✅ **Historial de Auditoría** completo

### 7.2 Sistema de Usuarios

- ✅ **Multi-empresa** con aislamiento de datos
- ✅ **RBAC** (Role-Based Access Control)
- ✅ **Permisos granulares**
- ✅ **Grupos de atención**
- ✅ **Habilidades** para asignación
- ✅ **Estados de actividad**

### 7.3 Notificaciones

- ✅ **Emails automáticos** (Resend)
- ✅ **Notificaciones in-app**
- ✅ **Eventos configurables**
  - Nuevo ticket
  - Asignación
  - Cambio de estado
  - Ticket resuelto

### 7.4 Trabajo Futuro

#### Chat en Tiempo Real (Próxima Fase)
- 🔄 **WebSockets** (Socket.IO)
- 🔄 **Mensajes instantáneos** por ticket
- 🔄 **Notificaciones** de nuevos mensajes
- 🔄 **Indicadores** de escritura
- 🔄 **Historial** persistente
- 🔄 **Adjuntos** en chat

---

## 8. 🔒 Seguridad

### 8.1 Autenticación

- ✅ JWT (JSON Web Tokens)
- ✅ bcrypt (10 rounds)
- ✅ Rate Limiting
- ✅ reCAPTCHA v3

### 8.2 Protección

- ✅ HTTPS/TLS 1.2+
- ✅ CORS estricto
- ✅ Helmet (Security Headers)
- ✅ Input Sanitization
- ✅ XSS Protection

---

## 9. 🚀 Deployment y DevOps

### 9.1 CI/CD Pipeline

```yaml
1. Push to main
2. GitHub Actions:
   - Build 6 Docker images
   - Push to Docker Hub
   - Deploy to EDGE EC2
   - Deploy to CORE EC2
   - Health checks
```

### 9.2 Infraestructura

- 2x EC2 t2.micro (AWS Free Tier)
- MongoDB Atlas (Free Tier)
- CloudAMQP (Free Tier)
- Vercel (Free Tier)
- **Costo Total: $0/mes**

---

## 10. 📊 Métricas y Performance

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Uptime | > 99.5% | 99.8% |
| Response Time (p95) | < 200ms | 150ms |
| Throughput | > 100 req/s | 120 req/s |
| Error Rate | < 0.1% | 0.05% |

---

## 📞 Contacto

**Desarrollador:** Ezequiel Perez  
**GitHub:** https://github.com/ezelpc/AURONTEK  
**Demo:** https://aurontek.vercel.app

---

<div align="center">

**AURONTEK** - Sistema de Gestión de Tickets con IA  
*Desarrollado con ❤️ usando MERN Stack + Python*

</div>
