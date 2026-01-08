# ✅ Corrección - Permisos de Roles en Empresa

## 🐛 Problema Encontrado

El usuario en `http://localhost:5000/empresa/roles` no podía editar roles aunque tenía los permisos:
```javascript
[
    "roles.view",
    "roles.create",
    "roles.edit",     // ← Este permiso
    "roles.delete",
    "roles.manage",
    // ... más permisos
]
```

### Causa Raíz

1. **Backend:** Las rutas esperaban `roles.manage` o `roles.create` para POST/PUT
2. **Frontend:** El botón de editar esperaba `roles.update` pero el usuario tenía `roles.edit`
3. **Inconsistencia:** Los nombres de los permisos no coincidían en backend y frontend

---

## ✅ Correcciones Implementadas

### 1. **Backend - Rutas de Roles** 
**Archivo:** `backend/usuarios-svc/src/Routes/role.routes.ts`

```typescript
// Actualizado para aceptar roles.edit también
router.post('/', verificarToken, requirePermission([
    PERMISOS.ROLES_MANAGE, 
    'roles.create', 
    'roles.edit'  // ✅ Ahora aceptado
]), roleController.crearRole);

router.put('/:id', verificarToken, requirePermission([
    PERMISOS.ROLES_MANAGE, 
    'roles.create', 
    'roles.edit'  // ✅ Ahora aceptado
]), roleController.actualizarRole);

router.delete('/:id', verificarToken, requirePermission([
    PERMISOS.ROLES_MANAGE, 
    'roles.delete'
]), roleController.eliminarRole);
```

### 2. **Frontend - Botones Flexibles**
**Archivo:** `frontend/src/pages/admin/roles/RolesPage.tsx`

Los botones ahora aceptan múltiples permisos:

```tsx
// Botón Crear
<ProtectedButton
    permission={[
        PERMISSIONS.ROLES_CREATE, 
        PERMISSIONS.ROLES_MANAGE, 
        'roles.create', 
        'roles.edit'  // ✅ Ahora aceptado
    ]}
>
    Crear Rol
</ProtectedButton>

// Botón Editar
<ProtectedButton
    permission={[
        PERMISSIONS.ROLES_UPDATE, 
        PERMISSIONS.ROLES_EDIT,    // ✅ Nuevo alias
        PERMISSIONS.ROLES_MANAGE, 
        'roles.edit'
    ]}
>
    Editar
</ProtectedButton>

// Botón Eliminar
<ProtectedButton
    permission={[
        PERMISSIONS.ROLES_DELETE, 
        PERMISSIONS.ROLES_MANAGE, 
        'roles.delete'
    ]}
>
    Eliminar
</ProtectedButton>
```

### 3. **Frontend - Constantes de Permisos**
**Archivo:** `frontend/src/constants/permissions.ts`

```typescript
// Roles
ROLES_VIEW: 'roles.view',
ROLES_CREATE: 'roles.create',
ROLES_UPDATE: 'roles.update',
ROLES_EDIT: 'roles.edit',      // ✅ Nuevo alias agregado
ROLES_DELETE: 'roles.delete',
ROLES_MANAGE: 'roles.manage',
```

### 4. **Frontend - Ruta Protegida**
**Archivo:** `frontend/src/App.tsx`

```tsx
// La ruta /empresa/roles ahora está protegida explícitamente
<Route element={<RequirePermission permission="roles.view" />}>
    <Route path="roles" element={<RolesPage />} />
</Route>
```

---

## 🔐 Matriz de Permisos Aceptados

| Acción | Permisos Aceptados |
|--------|-------------------|
| **Ver Roles** | `roles.view` |
| **Crear Rol** | `roles.create`, `roles.edit`, `roles.manage` |
| **Editar Rol** | `roles.update`, `roles.edit`, `roles.manage` |
| **Eliminar Rol** | `roles.delete`, `roles.manage` |

---

## 🧪 Cómo Validar

### Test 1: Ver página de roles en empresa
```
1. Accede a http://localhost:5000/empresa/roles
2. Si tienes roles.view → Página se carga ✅
3. Si no tienes el permiso → Se muestra "Acceso Denegado" ✅
```

### Test 2: Crear un rol
```
1. Haz clic en botón "Crear Rol"
2. Si tienes roles.create O roles.edit O roles.manage → Botón se muestra y es clickeable ✅
3. Envía los datos al backend
4. Backend valida que tengas el permiso → Creación exitosa ✅
```

### Test 3: Editar un rol
```
1. Haz clic en botón lápiz (editar)
2. Si tienes roles.update O roles.edit O roles.manage → Botón se muestra ✅
3. Modifica datos y guarda
4. Backend valida permiso → Actualización exitosa ✅
```

### Test 4: Eliminar un rol
```
1. Haz clic en botón papelera (eliminar)
2. Si tienes roles.delete O roles.manage → Botón se muestra ✅
3. Confirma eliminación
4. Backend valida permiso → Eliminación exitosa ✅
```

---

## 📝 Permisos Recomendados por Rol

### Admin Empresa (admin-interno)
```javascript
[
    'roles.view',
    'roles.create',
    'roles.edit',      // O use roles.manage para permisos totales
    'roles.delete',
    'users.view',
    'users.create',
    'users.update',
    'servicios.manage_local'
]
```

### Admin Subroot
```javascript
[
    'roles.view',
    'roles.create',
    'roles.edit',
    'roles.delete',
    'roles.manage',    // Permiso total
    // ... más permisos globales
]
```

### Soporte Técnico (Lectura)
```javascript
[
    'roles.view'       // Solo ver, sin editar
]
```

---

## 🔄 Cambios Realizados

| Archivo | Cambio |
|---------|--------|
| `backend/usuarios-svc/src/Routes/role.routes.ts` | ✅ POST/PUT aceptan `roles.edit` |
| `frontend/src/constants/permissions.ts` | ✅ Agregado `ROLES_EDIT` |
| `frontend/src/pages/admin/roles/RolesPage.tsx` | ✅ Botones aceptan múltiples permisos |
| `frontend/src/App.tsx` | ✅ Ruta `/empresa/roles` protegida |

---

## ⚠️ Notas Importantes

1. **Compatibilidad hacia atrás:** Seguimos soportando `roles.manage` y `roles.create`
2. **Múltiples permisos:** El `ProtectedButton` ahora acepta un array y verifica si el usuario tiene AL MENOS UNO
3. **Backend:** Las rutas aceptan cualquiera de los permisos listados (OR logic)
4. **No se rompió:** Los admin-general (con `['*']`) siguen teniendo acceso total

---

**Problema resuelto:** ✅ El usuario ahora puede editar roles con el permiso `roles.edit`
