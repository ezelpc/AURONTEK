# Correcciones de Control de Permisos - Gestión de Empresas

## 📋 Resumen
Se ha implementado un control de permisos granular para todas las acciones relacionadas con empresas, tanto en el backend como en el frontend. Se reemplazó el middleware genérico `esAdminGeneral` por validaciones específicas basadas en permisos.

---

## 🔧 Cambios Implementados

### 1. **Backend - Rutas Protegidas** (`backend/usuarios-svc/src/Routes/empresas.routes.ts`)

#### Antes:
```typescript
router.use(verificarToken, esAdminGeneral);
// Todas las rutas tenían el mismo control basado en rol
```

#### Después:
```typescript
router.use(verificarToken);

// Cada ruta requiere permisos específicos
router.post('/', tienePermiso('companies.create'), ...);
router.get('/', tienePermiso('companies.view_all'), ...);
router.get('/:id', tienePermiso('companies.view_all'), ...);
router.put('/:id', tienePermiso('companies.update'), ...);
router.delete('/:id', tienePermiso('companies.delete'), ...);
router.patch('/:id/licencia', tienePermiso('companies.suspend'), ...);
router.post('/:id/regenerar-codigo', tienePermiso('companies.regenerate_access_code'), ...);
```

**Ventajas:**
- ✅ Permisos granulares por acción
- ✅ Soporte para RBAC (Role-Based Access Control)
- ✅ Permite subadmins con permisos limitados
- ✅ Auditoría detallada por acción

---

### 2. **Backend - Controlador Mejorado** (`backend/usuarios-svc/src/Controllers/empresa.controller.ts`)

Se agregó logging de auditoría en cada acción:

```typescript
// Crear Empresa
console.log(`[EMPRESA CREATE] Usuario ${req.usuario?.correo} (${req.usuario?.rol}) creando empresa: ${nombreEmpresa}`);

// Listar Empresas
console.log(`[EMPRESA LIST] Usuario ${req.usuario?.correo} listando empresas`);

// Ver Detalle
console.log(`[EMPRESA DETAIL] Usuario ${req.usuario?.correo} viendo detalle de empresa: ${req.params.id}`);

// Actualizar
console.log(`[EMPRESA UPDATE] Usuario ${req.usuario?.correo} (${req.usuario?.rol}) actualizando empresa: ${id}`);

// Eliminar
console.log(`[DELETE EMPRESA] Usuario ${req.usuario?.correo} (${req.usuario?.rol}) eliminando empresa`);

// Suspender/Reactivar
console.log(`[EMPRESA SUSPEND] Usuario ${req.usuario?.correo} ${activo ? 'reactivando' : 'suspendiendo'} licencia de empresa: ${req.params.id}`);

// Regenerar Código
console.log(`[EMPRESA REGENERATE CODE] Usuario ${req.usuario?.correo} regenerando código de empresa: ${req.params.id}`);
```

---

### 3. **Frontend - Ruta Protegida** (`frontend/src/App.tsx`)

#### Antes:
```tsx
<Route path="empresas" element={<CompaniesPage />} />
```

#### Después:
```tsx
{/* Ruta protegida por permiso: Gestión de Empresas */}
<Route element={<RequirePermission permission="companies.view_all" />}>
    <Route path="empresas" element={<CompaniesPage />} />
</Route>
```

---

### 4. **Frontend - Botones con Permisos Granulares** (`frontend/src/pages/admin/companies/CompaniesPage.tsx`)

#### Botón Crear Empresa
```tsx
<ProtectedButton
    permission={PERMISSIONS.COMPANIES_CREATE}
    onClick={() => setIsCreating(true)}
>
    <Plus className="mr-2 h-4 w-4" /> {t('companies.new_company')}
</ProtectedButton>
```

#### Botón Editar
```tsx
<ProtectedButton
    permission={PERMISSIONS.COMPANIES_UPDATE}
    variant="ghost"
    size="icon"
    title={t('common.edit')}
    onClick={() => handleProtectedAction('edit', empresa)}
>
    <Pencil className="h-4 w-4 text-slate-500" />
</ProtectedButton>
```

#### Botón Suspender/Reactivar
```tsx
<ProtectedButton
    permission={PERMISSIONS.COMPANIES_SUSPEND}
    variant="ghost"
    size="icon"
    title={empresa.activo ? "Suspender Licencia" : "Reactivar Licencia"}
    onClick={() => handleProtectedAction('toggle', empresa)}
>
    {empresa.activo ? (
        <Ban className="h-4 w-4 text-orange-500" />
    ) : (
        <CheckCircle className="h-4 w-4 text-green-500" />
    )}
</ProtectedButton>
```

#### Botón Regenerar Código
```tsx
<ProtectedButton
    permission={PERMISSIONS.COMPANIES_REGENERATE_CODE}
    variant="ghost"
    size="icon"
    title="Regenerar Código Acceso"
    onClick={() => handleProtectedAction('regenerate', empresa)}
>
    <Key className="h-4 w-4 text-blue-500" />
</ProtectedButton>
```

#### Botón Eliminar
```tsx
<ProtectedButton
    permission={PERMISSIONS.COMPANIES_DELETE}
    variant="ghost"
    size="icon"
    title={t('common.delete')}
    onClick={() => handleProtectedAction('delete', empresa)}
>
    <Trash2 className="h-4 w-4 text-red-500" />
</ProtectedButton>
```

---

## 📊 Matriz de Permisos - Empresas

| Acción | Permiso | Descripción |
|--------|---------|-------------|
| **Ver Listado** | `companies.view_all` | Listar todas las empresas |
| **Ver Detalle** | `companies.view_all` | Ver información de una empresa |
| **Crear** | `companies.create` | Registrar nuevas empresas |
| **Editar** | `companies.update` | Modificar datos de una empresa |
| **Eliminar** | `companies.delete` | Dar de baja una empresa |
| **Suspender Licencia** | `companies.suspend` | Bloquear acceso a una empresa |
| **Reactivar Licencia** | `companies.suspend` | Reactivar licencia suspendida |
| **Regenerar Código** | `companies.regenerate_access_code` | Generar nuevo código de acceso |

---

## 🔐 Niveles de Acceso Recomendados

### Admin General (Aurontek HQ)
```javascript
Permisos: ['*'] // Acceso total
```

### Admin Sistema (Subroot)
```javascript
Permisos: [
    'companies.view_all',
    'companies.create',
    'companies.update',
    'companies.delete',
    'companies.suspend',
    'companies.regenerate_access_code'
]
```

### Admin Empresa (Interno)
```javascript
Permisos: [
    'companies.view_all',  // Solo para ver su propia empresa
    'users.view',
    'users.create',
    'users.update',
    'tickets.view_all',
    'tickets.assign'
]
```

### Soporte Técnico
```javascript
Permisos: [
    'tickets.view_all',
    'tickets.assign',
    'tickets.change_status'
]
```

---

## ✅ Validaciones Implementadas

### Backend
- ✅ Middleware `tienePermiso()` en cada ruta
- ✅ Logging de auditoría por acción
- ✅ Protección especial para Aurontek HQ
- ✅ Validación de rol para eliminar Aurontek HQ

### Frontend
- ✅ Ruta `/admin/empresas` protegida por permiso `companies.view_all`
- ✅ Botón crear protegido por `companies.create`
- ✅ Botón editar protegido por `companies.update`
- ✅ Botón suspender protegido por `companies.suspend`
- ✅ Botón regenerar código protegido por `companies.regenerate_access_code`
- ✅ Botón eliminar protegido por `companies.delete`

---

## 🔍 Auditoría

Todos los cambios se registran en los logs con el siguiente formato:

```
[EMPRESA CREATE] Usuario admin@example.com (admin-general) creando empresa: Acme Corp
[EMPRESA UPDATE] Usuario admin@example.com (admin-general) actualizando empresa: 6507abc123...
[EMPRESA SUSPEND] Usuario admin@example.com reactivando licencia de empresa: 6507abc123...
[DELETE EMPRESA] Usuario admin@example.com (admin-general) eliminando empresa
[EMPRESA REGENERATE CODE] Usuario admin@example.com regenerando código de empresa: 6507abc123...
```

---

## 📝 Archivos Modificados

1. ✅ `backend/usuarios-svc/src/Routes/empresas.routes.ts`
   - Reemplazo de `esAdminGeneral` por permisos granulares

2. ✅ `backend/usuarios-svc/src/Controllers/empresa.controller.ts`
   - Agregación de logging de auditoría
   - Mejora de mensajes de error

3. ✅ `frontend/src/App.tsx`
   - Protección de ruta con permiso `companies.view_all`

4. ✅ `frontend/src/pages/admin/companies/CompaniesPage.tsx`
   - Cambio de `COMPANIES_MANAGE` por permisos específicos
   - Botones individuales con permisos granulares

---

## 🚀 Próximos Pasos Recomendados

1. **Validar en Base de Datos**: Asegurar que los roles actuales tengan los permisos asignados
2. **Testing**: Probar cada acción con diferentes roles/permisos
3. **Documentación**: Actualizar documentación de permisos
4. **Migración**: Si es necesario, ejecutar scripts de migración para asignar permisos a roles existentes

---

## ⚠️ Notas Importantes

- El permiso `companies.view_all` es requerido tanto para **listar** como para **ver detalles**
- Los permisos `companies.suspend` se usan tanto para suspender como para reactivar (es la misma acción inversa)
- Aurontek HQ tiene protección adicional con código secreto almacenado en variables de entorno
- El rol `admin-subroot` no puede eliminar Aurontek HQ (protección adicional)

---

**Última actualización:** 8 de enero de 2026  
**Estado:** ✅ Completado
