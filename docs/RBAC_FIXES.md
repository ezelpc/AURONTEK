# Correcciones RBAC Críticas

## 1. Filtros Inteligentes - Sin Hardcodeo de Roles

### PROBLEMA ACTUAL:
```tsx
// ❌ INCORRECTO - Hardcodeo de roles
if (user?.rol && ['soporte', 'beca-soporte', 'resolutor-empresa', 'becario'].includes(user.rol)) {
    filters.push({ value: 'assigned', label: 'Asignados a mí' });
}
```

### SOLUCIÓN:
```tsx
// ✅ CORRECTO - Solo permisos
const getAvailableFilters = () => {
    const filters: Array<{value: string, label: string}> = [];
    
    // ASIGNADOS A MÍ - Si tiene permiso para ver asignados
    if (hasPermission('tickets.view_assigned')) {
        filters.push({ value: 'assigned', label: 'Asignados a mí' });
    }
    
    // CREADOS POR MÍ - Todos pueden ver los suyos
    filters.push({ value: 'my-tickets', label: 'Creados por mí' });
    
    // TODOS - Si tiene permiso para ver todos de empresa
    if (hasPermission('tickets.view_all') || hasPermission('tickets.view_all_company')) {
        filters.push({ value: 'all', label: 'Todos de mi empresa' });
    }
    
    return filters;
};
```

**Aplicar en:**
- `frontend/src/pages/empresa/EmpresaDashboard.tsx` (líneas 31-48)
- `frontend/src/pages/admin/tickets/TicketsPage.tsx` (ya corregido)

---

## 2. Cambio de Estado - Solo Agentes Asignados

### PROBLEMA:
**Actualmente cualquiera puede cambiar el estado desde las columnas**, incluso el creador del ticket.

### SOLUCIÓN:

**Opción A - Más Restrictiva (Recomendada):**
```tsx
// columns.tsx - Solo agente asignado puede cambiar estado
{
  accessorKey: "estado",
  header: "Estado",
  cell: ({ row, table }) => {
    const ticket = row.original;
    const currentUser = useAuthStore.getState().user;
    
    // Solo agente asignado O admin con permiso pueden cambiar
    const assignedId = ticket.agenteAsignado?._id || ticket.agenteAsignado;
    const userId = currentUser?._id || currentUser?.id;
    const isAssigned = assignedId && userId && assignedId.toString() === userId.toString();
    const canChangeStatus = isAssigned || hasPermission('tickets.change_status');
    
    if (!canChangeStatus) {
      // Solo mostrar badge, sin dropdown
      return <Badge variant={variant}>{displayText}</Badge>;
    }
    
    // Mostrar dropdown para cambiar estado
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge variant={variant} className="cursor-pointer">
            {displayText}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* ... opciones ... */}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
```

**Opción B - Más Flexible:**
```tsx
// Permitir cambio si:
// 1. Es el agente asignado, O
// 2. Tiene permiso tickets.change_status Y (es admin O tiene tickets.manage_global)

const canChangeStatus = 
  isAssigned || 
  (hasPermission('tickets.change_status') && 
   (hasPermission('tickets.view_all') || hasPermission('tickets.manage_global')));
```

**Mi Recomendación:**
Usa **Opción A**. El creador no debe cambiar el estado - solo puede:
- Ver el estado
- Comentar
- Calificar (cuando esté resuelto)

Los que SÍ pueden cambiar estado:
- Agente asignado (siempre)
- Admin con `tickets.change_status` (supervisión)
- Tutor (si está delegado)

---

## 3. Panel de Empresas - Admin No Ve Todas

### PROBLEMA:
Admin no puede ver listado de empresas.

### DIAGNÓSTICO:
Verificar que el permiso `companies.view_all` esté asignado al rol de admin.

### SOLUCIÓN:

**A. Backend - Asegurar permiso correcto:**
```typescript
// backend/usuarios-svc - Verificar que admin-general/admin-subroot tengan:
const adminPermissions = [
  'companies.view_all',
  'companies.create',
  'companies.update',
  'companies.suspend',
  // ... otros
];
```

**B. Frontend - Verificar ruta protegida:**
```tsx
// En CompaniesPage.tsx o ruta
import { PERMISSIONS } from '@/constants/permissions';

// Debe usar:
hasPermission(PERMISSIONS.COMPANIES_VIEW_ALL)

// NO hardcodear:
// ❌ if (user.rol === 'admin-general')
```

**C. Seed data - Actualizar permisos de admin:**
```typescript
// En seed_comprehensive.ts o similar
const adminGeneralRole = {
  nombre: 'Admin General',
  permisos: [
    'companies.view_all',      // ✅ Crítico
    'companies.create',
    'companies.update',
    'companies.delete',
    'companies.suspend',
    'tickets.view_all_global',
    'users.view_global',
    // ...
  ]
};
```

---

## 4. Matriz de Permisos por Funcionalidad

### Filtros de Tickets

| Filtro | Permiso Requerido | Descripción |
|--------|-------------------|-------------|
| "Creados por mí" | -(ninguno) | Todos los usuarios |
| "Asignados a mí" | `tickets.view_assigned` | Soporte/Resolutores |
| "Todos (empresa)" | `tickets.view_all` | Admins empresa |
| "Todos (global)" | `tickets.view_all_global` | Admins sistema |

### Acciones en Tickets

| Acción | Permiso | Condición Adicional |
|--------|---------|---------------------|
| Ver ticket | `tickets.view_created` O `tickets.view_assigned` | Es creador O asignado |
| Cambiar estado | `tickets.change_status` | **Y** es agente asignado |
| Asignar agente | `tickets.assign` | - |
| Delegar | `tickets.delegate` | Es agente actual |
| Comentar | -(ninguno) | Es creador O asignado |
| Calificar | `tickets.rate` | Es creador Y ticket resuelto |

### Gestión de Empresas

| Acción | Permiso | Scope |
|--------|---------|-------|
| Ver listado | `companies.view_all` | Global |
| Crear empresa | `companies.create` | Global |
| Editar empresa | `companies.update` | Global |
| Suspender | `companies.suspend` | Global |

---

## 5. Implementación Paso a Paso

### Paso 1: Corregir Filtros (Alta Prioridad) ⚠️

```bash
# Archivos a modificar:
1. frontend/src/pages/empresa/EmpresaDashboard.tsx
   Líneas 35-38: Remover check de rol
   Reemplazar con: hasPermission('tickets.view_assigned')

2. frontend/src/pages/admin/tickets/TicketsPage.tsx  
   Ya corregido ✅
```

### Paso 2: Cambio de Estado (Alta Prioridad) ⚠️

```bash
# Archivo:
frontend/src/pages/admin/tickets/columns.tsx

# Función a agregar (antes de columns):
const canUserChangeStatus = (ticket: any, user: any, hasPermission: Function) => {
  const assignedId = ticket.agenteAsignado?._id || ticket.agenteAsignado;
  const userId = user?._id || user?.id;
  const isAssigned = assignedId && userId && assignedId.toString() === userId.toString();
  
  // Solo agente asignado O admin con permiso explícito
  return isAssigned || hasPermission('tickets.change_status');
};

# Modificar cell de estado:
cell: ({ row, table }) => {
  const ticket = row.original;
  const { user, hasPermission } = useAuthStore.getState();
  
  if (!canUserChangeStatus(ticket, user, hasPermission)) {
    // Solo mostrar badge
    return <Badge variant={variant}>{displayText}</Badge>;
  }
  
  // Mostrar dropdown...
}
```

### Paso 3: Permisos de Empresas (Media Prioridad)

```bash
# 1. Verificar seeds tienen permiso
backend/usuarios-svc/src/seed_comprehensive.ts
Buscar: adminGeneralRole
Agregar: 'companies.view_all'

# 2. Verificar frontend usa permiso
frontend/src/pages/admin/companies/CompaniesPage.tsx
Debe tener: hasPermission(PERMISSIONS.COMPANIES_VIEW_ALL)

# 3. Reiniciar usuarios-svc después de seed
npm run dev
```

---

## 6. Testing

### Test 1: Filtros RBAC
```
1. Login como cliente (sin tickets.view_assigned)
2. Dashboard debe mostrar SOLO "Creados por mí"
3. ✅ No aparece selector si solo hay 1 filtro

4. Login como soporte (con tickets.view_assigned)
5. Dashboard debe mostrar selector con:
   - Asignados a mí
   - Creados por mí
6. ✅ Puede cambiar entre filtros
```

### Test 2: Cambio de Estado  
```
1. Login como cliente que creó ticket
2. Ver ticket en tabla
3. Click en badge de estado
4. ✅ NO debe abrir dropdown (solo badge estático)

5. Login como agente asignado al ticket
6. Click en badge de estado
7. ✅ Debe abrir dropdown con opciones
```

### Test 3: Empresas
```
1. Login como admin-general
2. Ir a /admin/empresas
3. ✅ Debe ver listado completo de empresas
4. ✅ Puede crear/editar/suspender
```

---

## 7. Commits Sugeridos

```bash
git add frontend/src/pages/empresa/EmpresaDashboard.tsx
git commit -m "fix(rbac): Eliminar hardcodeo de roles en filtros de dashboard empresa

- Usar solo permisos (tickets.view_assigned)
- Remover checks de rol hardcodeados
- Filtros se adaptan a permisos del usuario

Antes: Hardcodeo de ['soporte', 'beca-soporte', ...]
Ahora: hasPermission('tickets.view_assigned')"

git add frontend/src/pages/admin/tickets/columns.tsx
git commit -m "fix(rbac): Restringir cambio de estado solo a agentes asignados

- Solo agente asignado puede cambiar estado
- Admins con tickets.change_status también pueden
- Creadores NO pueden cambiar estado
- Badge estático para usuarios sin permiso

Seguridad: Previene que usuarios cambien estados incorrectamente"

git add backend/usuarios-svc/src/seed_comprehensive.ts
git commit -m "fix(permissions): Agregar companies.view_all a roles de admin

- admin-general ahora ve todas las empresas
- admin-subroot también tiene permiso
- Corrección de seeds de permisos"
```

---

## Resumen Ejecutivo

### Problemas Identificados:
1. ❌ Filtros hardcodeados a roles (violación RBAC)
2. ❌ Cualquiera puede cambiar estado de tickets
3. ❌ Admins no ven empresas (falta permiso)

### Soluciones:
1. ✅ Filtros basados en permisos únicamente
2. ✅ Cambio de estado solo para agentes asignados
3. ✅ Agregar `companies.view_all` a admins

### Impacto:
- **Seguridad mejorada**: Solo usuarios autorizados cambian estados
- **RBAC puro**: Sin hardcodeo de roles
- **Escalable**: Fácil agregar nuevos roles/permisos
