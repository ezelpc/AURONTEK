# 🔑 Configuración de Permisos por Rol - Empresas

Este documento detalla cómo configurar los permisos de gestión de empresas para diferentes roles en la base de datos.

---

## 📦 Permisos de Empresas

Todos los permisos relacionados con gestión de empresas:

```javascript
{
    'companies.view_all': 'Ver todas las empresas',
    'companies.create': 'Crear nuevas empresas',
    'companies.update': 'Editar datos de empresas',
    'companies.delete': 'Eliminar empresas',
    'companies.suspend': 'Suspender/Reactivar licencias',
    'companies.regenerate_access_code': 'Regenerar códigos de acceso'
}
```

---

## 👥 Configuración por Rol

### 1. **Admin General** (Aurontek - HQ)
**Descripción:** Acceso total al sistema

```javascript
// Opción A: Wildcard (Recomendado)
{
    _id: ObjectId,
    nombre: 'Admin General',
    slug: 'admin-general',
    descripcion: 'Administrador General - Acceso total',
    empresa: null,
    permisos: ['*'],
    nivel: 1,
    activo: true
}

// Opción B: Permisos explícitos
{
    _id: ObjectId,
    nombre: 'Admin General',
    slug: 'admin-general',
    descripcion: 'Administrador General - Acceso total',
    empresa: null,
    permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.delete',
        'companies.suspend',
        'companies.regenerate_access_code',
        // ... resto de permisos globales
        'users.view_global',
        'tickets.view_all_global',
        'servicios.manage_global'
    ],
    nivel: 1,
    activo: true
}
```

---

### 2. **Admin Subroot** (Soporte Aurontek)
**Descripción:** Gestión completa de empresas EXCEPTO eliminación

```javascript
{
    _id: ObjectId,
    nombre: 'Admin Subroot',
    slug: 'admin-subroot',
    descripcion: 'Administrador Sub-root - Gestión de empresas sin eliminar',
    empresa: null,
    permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.suspend',
        'companies.regenerate_access_code',
        // NO incluir: 'companies.delete'
        'users.view_global',
        'tickets.view_all_global',
        'servicios.manage_global'
    ],
    nivel: 2,
    activo: true
}
```

**Nota:** Este rol NO incluye `companies.delete` intencionalmente para mayor control.

---

### 3. **Admin Empresa** (Local)
**Descripción:** Gestión local de su propia empresa

```javascript
{
    _id: ObjectId,
    nombre: 'Administrador Local',
    slug: 'admin-interno',
    descripcion: 'Gestor de la empresa - Acceso local',
    empresa: ObjectId('EMPRESA_ID'), // ID de su empresa
    permisos: [
        // NO incluir permisos de empresas globales
        // Ya que es solo para su propia empresa
        'users.create',
        'users.update',
        'users.view',
        'tickets.view_all',
        'tickets.assign',
        'tickets.change_status',
        'servicios.manage_local',
        'roles.view',
        'roles.manage'
    ],
    nivel: 3,
    activo: true
}
```

**Nota:** No tiene acceso a `companies.*` para no interferir con administración global.

---

### 4. **Gestor de Empresas** (Nuevo - Opcional)
**Descripción:** Acceso completo a gestión de empresas EXCEPTO eliminación

Caso de uso: Un administrador dedicado a registrar y mantener empresas, pero sin poder eliminarlas (mayor control).

```javascript
{
    _id: ObjectId,
    nombre: 'Gestor de Empresas',
    slug: 'gestor-empresas',
    descripcion: 'Gestión de empresas - Sin eliminación',
    empresa: null,
    permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.suspend',
        'companies.regenerate_access_code'
        // NO incluir: 'companies.delete'
    ],
    nivel: 2,
    activo: true
}
```

---

### 5. **Soporte Técnico** (Lectura)
**Descripción:** Solo puede ver empresas

```javascript
{
    _id: ObjectId,
    nombre: 'Soporte Técnico',
    slug: 'soporte-tecnico',
    descripcion: 'Soporte técnico - Lectura de información',
    empresa: null,
    permisos: [
        'companies.view_all', // Solo lectura
        'tickets.view_all_global',
        'users.view_global'
    ],
    nivel: 4,
    activo: true
}
```

---

## 🗄️ Scripts MongoDB para Crear Roles

### Crear Admin Subroot mejorado
```javascript
db.roles.insertOne({
    _id: ObjectId(),
    nombre: 'Admin Subroot',
    slug: 'admin-subroot',
    descripcion: 'Administrador Sub-root - Gestión de empresas sin eliminar',
    empresa: null,
    permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.suspend',
        'companies.regenerate_access_code',
        'users.view_global',
        'tickets.view_all_global'
    ],
    nivel: 2,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
})
```

### Crear Gestor de Empresas
```javascript
db.roles.insertOne({
    _id: ObjectId(),
    nombre: 'Gestor de Empresas',
    slug: 'gestor-empresas',
    descripcion: 'Gestión de empresas - Sin eliminación',
    empresa: null,
    permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.suspend',
        'companies.regenerate_access_code'
    ],
    nivel: 2,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
})
```

### Actualizar permisos de rol existente
```javascript
// Agregar permisos faltantes a un rol
db.roles.updateOne(
    { slug: 'admin-subroot' },
    { $set: { permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.suspend',
        'companies.regenerate_access_code',
        'users.view_global',
        'tickets.view_all_global'
    ]} }
)

// O agregar solo un permiso
db.roles.updateOne(
    { slug: 'admin-subroot' },
    { $addToSet: { permisos: 'companies.regenerate_access_code' } }
)
```

---

## 👤 Asignación de Permisos a Usuarios

### Usuario con múltiples permisos individuales
```javascript
db.usuarios.updateOne(
    { _id: ObjectId('USER_ID') },
    { $set: { 
        permisos: [
            'companies.view_all',
            'companies.update',
            'users.view_global'
        ]
    }}
)
```

### Usuario con rol + permisos adicionales
```javascript
db.usuarios.updateOne(
    { _id: ObjectId('USER_ID') },
    { $set: { 
        rol: 'gestor-empresas',
        permisos: [] // El rol proporcionará sus permisos automáticamente
    }}
)
```

---

## 🔍 Queries útiles

### Ver todos los roles disponibles
```javascript
db.roles.find().pretty()
```

### Ver permisos de un rol específico
```javascript
db.roles.findOne({ slug: 'admin-subroot' }).permisos
```

### Ver todos los usuarios de un rol
```javascript
db.usuarios.find({ rol: 'admin-subroot' }).count()
```

### Ver usuarios con permiso específico
```javascript
db.usuarios.find({ permisos: 'companies.create' }).count()
```

### Agregar permiso a todos los usuarios con un rol
```javascript
db.usuarios.updateMany(
    { rol: 'admin-subroot' },
    { $push: { permisos: 'companies.regenerate_access_code' } }
)
```

---

## 📋 Matriz de Decisión: ¿Qué permiso necesita?

```
¿Necesita ver empresas?
├── Sí
│   ├── ¿Necesita crear nuevas?
│   │   ├── Sí
│   │   │   ├── ¿Necesita editar?
│   │   │   │   ├── Sí
│   │   │   │   │   └── ¿Necesita eliminar?
│   │   │   │   │       ├── Sí → Admin General o Admin Subroot (sin delete)
│   │   │   │   │       └── No → Gestor de Empresas
│   │   │   │   └── No → Solo create
│   │   └── No
│   │       ├── ¿Necesita editar?
│   │       │   ├── Sí → companies.view_all, companies.update
│   │       │   └── No → companies.view_all (Solo lectura)
│   └── No → Sin permiso de empresas
```

---

## ✅ Checklist de Configuración

- [ ] Admin General con wildcard `['*']` configurado
- [ ] Admin Subroot sin permiso `companies.delete`
- [ ] Admin Empresa (interno) sin permisos de gestión global
- [ ] Todos los permisos coinciden entre backend y DB
- [ ] Los roles están activos (`activo: true`)
- [ ] Los niveles de rol son apropiados (1=admin, 2=subroot, 3=local, 4=soporte)
- [ ] Los usuarios están asignados a roles correctos
- [ ] Se ha probado acceso con diferentes usuarios

---

## 📚 Referencias

- Backend permisos: `backend/usuarios-svc/src/Constants/permissions.ts`
- Frontend permisos: `frontend/src/constants/permissions.ts`
- Ruta empresas: `backend/usuarios-svc/src/Routes/empresas.routes.ts`
- Modelo Role: `backend/usuarios-svc/src/Models/Role.model.ts`

---

**Última actualización:** 8 de enero de 2026  
**Versión:** 1.0
