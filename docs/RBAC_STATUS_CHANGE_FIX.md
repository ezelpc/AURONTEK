# Fix RBAC - Cambio de Estado en Tickets

✅ **Commit 1: Filtros RBAC** - Ya aplicado

## Pendiente: Cambio de Estado Solo para Agentes Asignados

### Ubicación
`frontend/src/pages/admin/tickets/columns.tsx` (líneas 62-140)

### Cambio Requerido

**ANTES:** Cualquiera puede hacer click en el badge de estado y cambiarlo

**DESPUÉS:** Solo agente asignado puede cambiar estado

### Código a Agregar

```tsx
// Al inicio del archivo, después de imports
import { useAuthStore } from '@/auth/auth.store';

// Función helper ANTES de export const columns
const canUserChangeStatus = (ticket: any): boolean => {
  const { user, hasPermission } = useAuthStore.getState();
  
  // 1. Es el agente asignado?
  const assignedId = ticket.agenteAsignado?._id || ticket.agenteAsignado;
  const userId = user?._id || user?.id;
  const isAssigned = assignedId && userId && assignedId.toString() === userId.toString();
  
  // 2. O tiene permiso explícito de admin?
  const hasExplicitPermission = hasPermission('tickets.change_status');
  
  return isAssigned || hasExplicitPermission;
};

// Modificar la celda de estado (línea ~65):
{
  accessorKey: "estado",
  header: "Estado",
  cell: ({ row, table }) => {
    const ticket = row.original;
    const statusRaw = row.getValue("estado") as string;
    const status = statusRaw?.toLowerCase() || '';
    
    // Determinar variante y estilo...
    // ... código existente ...
    
    // ⬇️ AGREGAR ESTA VALIDACIÓN
    if (!canUserChangeStatus(ticket)) {
      // Solo mostrar badge, sin dropdown
      return (
        <Badge variant={variant} style={badgeStyle}>
          {displayText}
        </Badge>
      );
    }
    
    // Mostrar dropdown con opciones (código existente)
    return (
      <DropdownMenu>
        {...}
      </DropdownMenu>
    );
  }
}
```

### Lógica

**Pueden cambiar estado:**
- ✅ Agente asignado al ticket
- ✅ Admin/Tutor con permiso `tickets.change_status`

**NO pueden:**
- ❌ Creator del ticket
- ❌ Otros agentes no asignados
- ❌ Usuarios sin permiso

### Testing

1. Login como cliente que creó ticket
2. Ver tabla de tickets
3. ✅ Badge debe ser estático (no clickeable)

4. Login como agente asignado
5. ✅ Badge debe tener dropdown

6. Login como admin con tickets.change_status
7. ✅ Badge debe tener dropdown

### Estado Actual
⏳ Pendiente de implementar

**¿Implemento este cambio ahora?**
