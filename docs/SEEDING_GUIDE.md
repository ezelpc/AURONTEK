# Guía del Sistema de Seeding y RBAC

Esta guía describe el sistema de inicialización de datos (seeding) y el modelo de control de acceso (RBAC) implementado en AURONTEK.

## 1. Modelo de Acceso y Catálogo de Servicios

El sistema utiliza un modelo de permisos **User-Centric** y un **Catálogo de Servicios Dual** para diferenciar entre los servicios ofrecidos por Aurontek y los servicios internos de cada cliente.

- **Catálogo Global (Helpdesk Aurontek)**: Servicios ofrecidos por Aurontek a sus clientes. Son gestionados por administradores de `Aurontek HQ` y los tickets generados se dirigen a la cola de soporte de Aurontek.

- **Catálogo Local (Servicios Internos)**: Servicios que cada empresa cliente crea para su propio uso interno. Son gestionados por los administradores de dicha empresa y los tickets se resuelven internamente.

### 1.1 Permisos Clave

- **`servicios:manage_global`**: Permite a un usuario de Aurontek gestionar el catálogo de servicios de Helpdesk.
- **`servicios:manage_local`**: Permite a un administrador de una empresa cliente gestionar su propio catálogo de servicios internos.
- **Granularidad**: Los permisos siguen el formato `recurso:acción` (ej. `tickets:create`, `users:read`).
- **Scope**: Los permisos pueden ser globales o limitados a una empresa específica.

## 2. Datos Iniciales (Seed)

El script `seed_full.ts` genera un entorno completo de prueba con las siguientes entidades:

### 2.1 Empresas
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| **Aurontek HQ** | Sistema | Empresa propietaria/administradora del sistema |
| **Test S.A.** | Cliente | Empresa cliente para pruebas de integración |

### 2.2 Usuarios de Prueba
Todos los usuarios se crean con la contraseña por defecto: `Password123!`

| Email | Rol Lógico | Permisos Clave |
|-------|------------|----------------|
| `eperez@aurontek.com` | Super Admin | `*` (Acceso total a todo, incluyendo ambos catálogos) |
| `soporte@aurontek.com` | Agente Soporte | `tickets:view_global_queue` (Atiende tickets de clientes) |
| `gerente@testsa.com` | Cliente Admin | `servicios:manage_local` (Gestiona su catálogo interno) |
| `empleado@testsa.com` | Cliente User | `tickets:create`, `tickets:read_own` |

### 2.3 Servicios
Se inicializan dos tipos de servicios para demostrar la funcionalidad:
- **Globales (Helpdesk Aurontek)**:
  - Falla en Plataforma Aurontek
  - Consulta de Facturación
- **Locales (Test S.A.)**:
  - Reseteo de Contraseña Interna
  - VPN Access

## 3. Ejecución del Seed

### Requisitos Previos
- MongoDB corriendo (local o remoto)
- Node.js v18+
- Variables de entorno configuradas (`MONGODB_URI`)

### Pasos para Ejecutar

1. **Navegar al servicio de usuarios:**
   ```bash
   cd backend/usuarios-svc
   ```

2. **Instalar dependencias (si es necesario):**
   ```bash
   npm install
   ```

3. **Compilar y Ejecutar:**
   El seed está escrito en TypeScript, por lo que debe compilarse o ejecutarse con `ts-node`.
   
   **Opción A: Build y Run (Producción/CI)**
   ```bash
   npm run build
   node dist/seed_full.js
   ```

   **Opción B: Desarrollo Directo**
   ```bash
   npx ts-node src/seed_full.ts
   ```

## 4. Personalización

Para agregar nuevos datos, edite el archivo `src/seed_full.ts`:

- **Agregar Permisos**: Modifique el array `PERMISSIONS_LIST` al inicio del archivo.
- **Nuevos Usuarios**: Agregue objetos al array `users` en la función `seedUsers`.

## 5. Troubleshooting

**Error: "Duplicate key error"**
- El seed intenta limpiar las colecciones antes de insertar (`deleteMany({})`). Si falla, asegúrese de que la base de datos esté accesible y el usuario tenga permisos de escritura.

**Error: "Module not found"**
- Asegúrese de estar ejecutando el script desde el directorio correcto y que las rutas a los modelos (`../models/...`) sean correctas.

**Verificación**
Para verificar que el seed funcionó, puede consultar la base de datos:
```bash
mongosh "mongodb://localhost:27017/aurontek" --eval "db.usuarios.find().pretty()"
```