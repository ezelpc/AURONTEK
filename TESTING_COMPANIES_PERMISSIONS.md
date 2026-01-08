# 🧪 Checklist de Testing - Control de Permisos de Empresas

## Pre-requisitos
- [ ] Base de datos actualizada con usuarios de prueba
- [ ] Variables de entorno configuradas correctamente
- [ ] Token JWT válido para los usuarios de prueba

---

## 🔐 Casos de Prueba por Permiso

### 1. **Ver Listado de Empresas** (`companies.view_all`)

#### ✅ Debe funcionar
- [ ] Admin General listando empresas (`GET /api/empresas`)
- [ ] Admin Subroot listando empresas
- [ ] Usuario con permiso `companies.view_all` viendo `/admin/empresas`

#### ❌ Debe ser denegado
- [ ] Admin Interno sin permiso específico
- [ ] Usuario final sin permiso
- [ ] Solicitud sin token

**Comando curl:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/empresas
```

---

### 2. **Crear Empresa** (`companies.create`)

#### ✅ Debe funcionar
- [ ] Admin General creando empresa
- [ ] Usuario con permiso `companies.create`
- [ ] Botón "Crear Empresa" visible en frontend

#### ❌ Debe ser denegado
- [ ] Admin Interno sin permiso
- [ ] Usuario final intentando crear
- [ ] Solicitud sin token

**Comando curl:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreEmpresa": "Test Corp",
    "rfc": "RFC123456789",
    "correo": "contact@test.com",
    "plan": "Premium",
    "nombreAdminInterno": "Admin",
    "correoAdminInterno": "admin@test.com",
    "passwordAdminInterno": "SecurePass123"
  }' \
  http://localhost:3001/api/empresas
```

---

### 3. **Editar Empresa** (`companies.update`)

#### ✅ Debe funcionar
- [ ] Admin General editando empresa
- [ ] Usuario con permiso `companies.update`
- [ ] Botón editar visible y funcional

#### ❌ Debe ser denegado
- [ ] Admin Interno sin permiso
- [ ] Usuario sin permiso de actualización
- [ ] Solicitud sin token

**Comando curl:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "New Company Name"}' \
  http://localhost:3001/api/empresas/COMPANY_ID
```

---

### 4. **Suspender/Reactivar Licencia** (`companies.suspend`)

#### ✅ Debe funcionar
- [ ] Admin General suspendiendo licencia
- [ ] Admin General reactivando licencia
- [ ] Usuario con permiso `companies.suspend`
- [ ] Botón funcionar correctamente

#### ❌ Debe ser denegado
- [ ] Admin sin permiso
- [ ] Usuario final
- [ ] Solicitud sin token

**Comando curl:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activo": false}' \
  http://localhost:3001/api/empresas/COMPANY_ID/licencia
```

---

### 5. **Regenerar Código de Acceso** (`companies.regenerate_access_code`)

#### ✅ Debe funcionar
- [ ] Admin General regenerando código
- [ ] Usuario con permiso específico
- [ ] Botón genera nuevo código correctamente

#### ❌ Debe ser denegado
- [ ] Admin sin permiso
- [ ] Usuario final
- [ ] Solicitud sin token

**Comando curl:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/empresas/COMPANY_ID/regenerar-codigo
```

---

### 6. **Eliminar Empresa** (`companies.delete`)

#### ✅ Debe funcionar
- [ ] Admin General eliminando empresa (no Aurontek HQ)
- [ ] Usuario con permiso `companies.delete`
- [ ] Botón funciona y pide confirmación

#### ❌ Debe ser denegado
- [ ] Admin sin permiso
- [ ] Intentar eliminar Aurontek HQ sin código correcto
- [ ] Admin Subroot intentando eliminar Aurontek HQ
- [ ] Usuario final
- [ ] Solicitud sin token

**Comando curl:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3001/api/empresas/COMPANY_ID
```

---

## 🎭 Pruebas de Roles/Permisos

### Admin General
```javascript
{
    rol: 'admin-general',
    permisos: ['*'],
    esperado: Acceso a TODAS las acciones de empresas
}
```

**Pruebas:**
- [ ] Ver listado ✓
- [ ] Crear ✓
- [ ] Editar ✓
- [ ] Suspender ✓
- [ ] Regenerar código ✓
- [ ] Eliminar ✓
- [ ] Editar Aurontek HQ con código correcto ✓
- [ ] Eliminar Aurontek HQ con código correcto ✓

### Admin Subroot
```javascript
{
    rol: 'admin-subroot',
    permisos: [
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.suspend',
        'companies.regenerate_access_code'
    ],
    esperado: Acceso a la mayoría de acciones EXCEPTO eliminar
}
```

**Pruebas:**
- [ ] Ver listado ✓
- [ ] Crear ✓
- [ ] Editar ✓
- [ ] Suspender ✓
- [ ] Regenerar código ✓
- [ ] Intentar eliminar ✗ (debe fallar)
- [ ] Intentar eliminar Aurontek HQ ✗ (debe fallar)

### Admin Interno
```javascript
{
    rol: 'admin-interno',
    empresa: 'EMPRESA_ID',
    permisos: [],
    esperado: SIN acceso a gestión de empresas
}
```

**Pruebas:**
- [ ] Intentar ver listado ✗ (debe fallar)
- [ ] Intentar crear ✗ (debe fallar)
- [ ] Intentar editar ✗ (debe fallar)
- [ ] Intentar suspender ✗ (debe fallar)
- [ ] Intentar regenerar ✗ (debe fallar)
- [ ] Intentar eliminar ✗ (debe fallar)

---

## 🖥️ Pruebas de Frontend

### Visibilidad de Botones

#### Con Permiso `companies.create`
- [ ] Botón "Crear Empresa" visible
- [ ] Botón habilitado y funcional

#### Sin Permiso `companies.create`
- [ ] Botón "Crear Empresa" oculto o deshabilitado

#### Con Permiso `companies.update`
- [ ] Botón lápiz (editar) visible
- [ ] Botón habilitado y funcional

#### Sin Permiso `companies.update`
- [ ] Botón lápiz oculto o deshabilitado

#### Con Permiso `companies.suspend`
- [ ] Botón prohibido (suspender) visible
- [ ] Botón habilitado y funcional

#### Con Permiso `companies.regenerate_access_code`
- [ ] Botón clave (regenerar) visible
- [ ] Botón habilitado y funcional

#### Con Permiso `companies.delete`
- [ ] Botón papelera (eliminar) visible
- [ ] Botón habilitado y funcional

---

## 📊 Pruebas de Auditoría (Logs)

Verificar que aparecen en los logs del servidor:

### Crear Empresa
```
[EMPRESA CREATE] Usuario admin@example.com (admin-general) creando empresa: Test Corp
```
- [ ] Log presente ✓
- [ ] Usuario correcto ✓
- [ ] Rol correcto ✓
- [ ] Nombre empresa correcto ✓

### Listar Empresas
```
[EMPRESA LIST] Usuario admin@example.com listando empresas
```
- [ ] Log presente ✓

### Ver Detalle
```
[EMPRESA DETAIL] Usuario admin@example.com viendo detalle de empresa: 6507abc123...
```
- [ ] Log presente ✓

### Actualizar
```
[EMPRESA UPDATE] Usuario admin@example.com (admin-general) actualizando empresa: 6507abc123...
```
- [ ] Log presente ✓

### Suspender/Reactivar
```
[EMPRESA SUSPEND] Usuario admin@example.com reactivando licencia de empresa: 6507abc123...
```
- [ ] Log presente ✓
- [ ] Indica acción correcta (reactivando/suspendiendo) ✓

### Regenerar Código
```
[EMPRESA REGENERATE CODE] Usuario admin@example.com regenerando código de empresa: 6507abc123...
```
- [ ] Log presente ✓

### Eliminar
```
[DELETE EMPRESA] Usuario admin@example.com (admin-general) eliminando empresa
```
- [ ] Log presente ✓

---

## 🚨 Casos de Error a Validar

### Error 401 - Unauthorized
- [ ] Sin token: Respuesta `401 - Acceso denegado. Token no proporcionado.`
- [ ] Token inválido: Respuesta `401 - Token no válido o expirado.`

### Error 403 - Forbidden
- [ ] Sin permiso `companies.view_all`: `403 - Acceso denegado. Se requiere el permiso: companies.view_all`
- [ ] Sin permiso `companies.create`: `403 - Acceso denegado. Se requiere el permiso: companies.create`
- [ ] Admin Subroot eliminando: `403 - Admin Subroot no tiene permisos para eliminar Aurontek HQ.`
- [ ] Código Aurontek incorrecto: `403 - Código de protección de Aurontek HQ incorrecto.`

### Error 400 - Bad Request
- [ ] Faltan campos obligatorios en creación
- [ ] ID inválido en parámetros

### Error 404 - Not Found
- [ ] Empresa no existe: `404 - Empresa no encontrada`

---

## ✅ Checklist Final

- [ ] Todos los permisos se validan en backend
- [ ] Todos los botones muestran/ocultan según permisos
- [ ] Logs de auditoría se generan correctamente
- [ ] Errores de permiso son apropiados (403)
- [ ] Protección Aurontek HQ funciona
- [ ] Diferentes roles tienen acceso correcto
- [ ] No hay errores TypeScript/JavaScript
- [ ] Las rutas están protegidas en frontend

---

**Última actualización:** 8 de enero de 2026  
**Versión:** 1.0
