# ✅ CHECKLIST DE VERIFICACIÓN - Dashboard de Empresas

**Uso:** Usar este checklist para verificar que todos los componentes funcionan correctamente.  
**Frecuencia:** Después de cada deployment  
**Responsable:** QA / Dev Lead

---

## 🎯 PRUEBAS MANUALES - Dashboard de Empresas

### ✅ Sección 1: Acceso al Dashboard

- [ ] Usuario empresa puede acceder a `/empresa/dashboard`
- [ ] Dashboard carga sin errores en consola
- [ ] Se muestran 4 stat cards (Total, Abiertos, En Proceso, Cerrados)
- [ ] Los números en las cards coinciden con los tickets
- [ ] Sección de "Actividad Reciente" muestra hasta 5 tickets

### ✅ Sección 2: Métricas Correctas

- [ ] **Total Tickets:** Suma correcta de todos los tickets del usuario
- [ ] **Tickets Abiertos:** Solo tickets con estado 'abierto'
- [ ] **En Proceso:** Solo tickets con estado 'en_proceso'
- [ ] **Cerrados:** Tickets con estado 'cerrado' o 'resuelto'
- [ ] Las métricas se actualizan al crear nuevo ticket
- [ ] Las métricas se actualizan al cambiar estado de ticket

#### Prueba de Métricas:
```bash
1. Crear 3 tickets (todos en estado 'abierto')
   → Total debe ser 3
   → Abiertos debe ser 3
   → En Proceso debe ser 0
   → Cerrados debe ser 0

2. Cambiar 1 ticket a 'en_proceso'
   → Abiertos debe ser 2
   → En Proceso debe ser 1

3. Cambiar 1 ticket a 'cerrado'
   → Abiertos debe ser 2
   → En Proceso debe ser 0
   → Cerrados debe ser 1
```

### ✅ Sección 3: Filtros Inteligentes

#### Filtro "Creados por mí"
- [ ] Disponible para todos los usuarios
- [ ] Muestra solo tickets creados por el usuario actual
- [ ] No incluye tickets creados por otros
- [ ] Al seleccionar, las métricas se recalculan
- [ ] Al cambiar user, los tickets se refiltrán

#### Filtro "Asignados a mí"
- [ ] Solo visible si usuario tiene permiso `TICKETS_VIEW_ASSIGNED`
- [ ] Muestra solo tickets donde `agenteAsignado === usuarioId`
- [ ] Las métricas se actualizan correctamente
- [ ] Si usuario no tiene permiso, opción no aparece

#### Filtro "Todos de mi empresa"
- [ ] Solo visible si usuario tiene permiso `TICKETS_VIEW_ALL`
- [ ] Muestra todos los tickets de la empresa
- [ ] Incluye tickets de otros usuarios
- [ ] Si no tiene permiso, opción no aparece

#### Prueba de Filtros:
```bash
USUARIO: Juan (permisos: TICKETS_VIEW_ASSIGNED, TICKETS_VIEW_ALL)
TICKETS EXISTENTES:
  - T1: Creado por Juan, Asignado a Juan
  - T2: Creado por Juan, Asignado a Pedro
  - T3: Creado por Pedro, Asignado a Juan
  - T4: Creado por Pedro, Asignado a Pedro

RESULTADOS ESPERADOS:
  - "Creados por mí" → T1, T2 (2 tickets)
  - "Asignados a mí" → T1, T3 (2 tickets)
  - "Todos de mi empresa" → T1, T2, T3, T4 (4 tickets)
```

---

## 🎯 PRUEBAS MANUALES - Cargas Masivas

### ✅ Carga de Usuarios

**Endpoint:** `POST /api/usuarios/actions/import`

#### Prueba 1: Carga Exitosa
```bash
CSV VÁLIDO:
nombre,correo,password
Juan Pérez,juan@test.com,Pass123!
María García,maria@test.com,Pass456!
```

- [ ] Carga se completa exitosamente
- [ ] Status 201
- [ ] Mensaje: "Importación completada. 2 usuarios creados."
- [ ] Los 2 usuarios aparecen en base de datos
- [ ] Contraseñas están hasheadas (no en claro)
- [ ] Correos están en lowercase

#### Prueba 2: Archivo con Errores
```bash
CSV INVÁLIDO:
nombre,correo,password
Juan Pérez,juan@test.com,Pass123!
María García,,Pass456!  <- Falta correo
```

- [ ] Se muestra error indicando fila 2 falta correo
- [ ] Usuario válido (Juan) se crea (NUEVA MEJORA)
- [ ] Usuario inválido (María) no se crea

#### Prueba 3: Validación de Permisos
- [ ] Usuario sin permiso `usuarios.import` recibe 403
- [ ] Usuario local solo puede importar a su empresa
- [ ] Admin global puede importar a cualquier empresa

### ✅ Carga de Servicios

**Endpoint:** `POST /api/services/bulk-upload`

#### Prueba 1: Carga Exitosa
- [ ] Archivo CSV se procesa sin errores
- [ ] Nuevos servicios aparecen en BD
- [ ] Servicios NO se duplican en cargas posteriores (append mode)
- [ ] Alcance 'global' vs 'local' se respeta

#### Prueba 2: Validaciones
- [ ] Error si falta 'nombre'
- [ ] Error si falta 'tipo'
- [ ] Error si falta 'categoria'

### ✅ Carga de Habilidades

**Endpoint:** `POST /api/habilidades/bulk`

#### Prueba 1: Create or Update
```bash
CSV:
nombre,descripcion
Soporte,Grupo de soporte
Infraestructura,Grupo IT

Primera carga: Crea 2 habilidades
Segunda carga (mismos nombres): Actualiza descripciones
```

- [ ] Primera carga: created=2, updated=0
- [ ] Segunda carga: created=0, updated=2
- [ ] Reporta estadísticas correctas

#### Prueba 2: Descarga de Template
- [ ] Endpoint `GET /api/servicios/template` devuelve CSV
- [ ] Archivo tiene formato correcto
- [ ] Header tiene columnas requeridas

---

## 🎯 PRUEBAS MANUALES - Recuperación de Contraseña

### ✅ Flujo 1: Olvide Contraseña (Self-Service)

**Página:** `/empresa/forgot-password`

#### Paso 1: Acceso
- [ ] Página se abre sin errores
- [ ] Link "¿Olvidaste tu contraseña?" visible en login

#### Paso 2: Formulario
- [ ] Campo de email es required
- [ ] Campo de código de acceso es required
- [ ] Botón "Enviar Instrucciones" está deshabilitado sin datos
- [ ] Código de acceso NO permite copy/paste (medida de seguridad)

#### Paso 3: Envío
```bash
1. Ingresar email válido
2. Ingresar código de acceso correcto
3. Click "Enviar Instrucciones"
```

- [ ] Muestra pantalla de éxito
- [ ] Email se envía (verificar en mailbox)
- [ ] Email contiene link reset con token
- [ ] Link tiene formato: `/empresa/reset-password/TOKEN`
- [ ] Respuesta es genérica incluso si email no existe (seguridad)

#### Paso 4: Email Recibido
- [ ] Email tiene asunto "Recuperación de Contraseña - Aurontek"
- [ ] Email contiene link clickeable
- [ ] Link funciona y lleva a página de reset

### ✅ Flujo 2: Reset de Contraseña

**Página:** `/empresa/reset-password/:token` o `/empresa/reset-password?token=XXX`

#### Paso 1: Token Válido
- [ ] Página se abre
- [ ] Forma de nueva contraseña visible
- [ ] Formulario require nueva contraseña

#### Paso 2: Validaciones
- [ ] Error si contraseña < 6 caracteres
- [ ] Error si confirmar contraseña no coincide
- [ ] Botón deshabilitado mientras procesa

#### Paso 3: Reset Exitoso
```bash
1. Ingresar nueva contraseña (ej: NuevaPass123)
2. Confirmar contraseña
3. Click "Actualizar Contraseña"
```

- [ ] Muestra pantalla de éxito
- [ ] Pantalla muestra "Contraseña Actualizada!"
- [ ] Auto-redirige a login en 5 segundos
- [ ] Nueva contraseña funciona en login

#### Paso 4: Token Inválido o Expirado
- [ ] Token expirado (> 1 hora): "Token inválido o ha expirado"
- [ ] Token manipulado: "Token inválido"
- [ ] Se redirige a login

#### Paso 5: Validación Extra
- [ ] Usuario NO puede usar mismo reset link 2 veces
- [ ] Token se borra después del reset exitoso

### ✅ Flujo 3: Recovery por Admin

**Admin recuperando contraseña de usuario**

#### Acceso
- [ ] Página de usuarios accesible: `/admin/usuarios`
- [ ] Botón de "reset" o "key" icon visible en cada usuario
- [ ] Solo usuarios con permiso `users.recover_password_*` ven botón

#### Acción
```bash
1. Click botón reset en usuario
2. Sistema genera contraseña temporal (12 chars)
3. Envía email a usuario
```

- [ ] Email recibido con contraseña temporal
- [ ] Contraseña tiene caracteres especiales (ej: `Temp@Pass123`)
- [ ] Email recomendador cambiar contraseña inmediatamente
- [ ] Usuario logueado puede cambiar contraseña luego

#### Validaciones de Permisos
- [ ] Admin local solo puede resetear usuarios de su empresa
- [ ] Admin global puede resetear cualquier usuario
- [ ] Admin-interno NO puede auto-resetear contraseña

---

## 🔧 PRUEBAS TÉCNICAS - Backend

### ✅ Validación de Endpoints

```bash
# Dashboard Stats
GET /api/usuarios/dashboard/stats
→ Response: { empresas: { total, activas, inactivas }, usuarios: { ... } }

# Importar Usuarios
POST /api/usuarios/actions/import
→ Content-Type: multipart/form-data
→ Field: 'file' (CSV)
→ Response: { msg, created?, rejected?, errors? }

# Importar Servicios
POST /api/services/bulk-upload
→ Content-Type: multipart/form-data
→ Response: { message, servicios: [...] }

# Importar Habilidades
POST /api/habilidades/bulk
→ Content-Type: multipart/form-data
→ Response: { msg, stats: { processed, created, updated, errors } }

# Recuperación de Contraseña
POST /api/auth/forgot-password
→ Body: { email, codigoAcceso }
→ Response: { msg: "Si el usuario existe..." }

# Reset de Contraseña
POST /api/auth/reset-password
→ Body: { token, password }
→ Response: { msg: "Contraseña actualizada correctamente." }

# Recovery Admin
POST /api/usuarios/:id/recover-password
→ Response: { msg: "Contraseña restablecida..." }
```

### ✅ Validación de Permisos

```bash
# Carga masiva - Sin permiso
POST /api/usuarios/actions/import (sin permiso usuarios.import)
→ Status: 403 Forbidden

# Carga masiva - Permiso local
POST /api/usuarios/actions/import (admin-local para otra empresa)
→ Status: 400 "Las cargas masivas solo están permitidas..."

# Recovery contraseña - Local
POST /api/usuarios/123/recover-password (admin-local, otra empresa)
→ Status: 403 "Solo puedes restablecer contraseñas de tu empresa."

# Recovery contraseña - Global
POST /api/usuarios/123/recover-password (admin-global, cualquier empresa)
→ Status: 200 OK
```

### ✅ Validación de Errores

```bash
# Email inválido en carga de usuarios
→ Error en fila X indicada

# CSV vacío
→ "El archivo CSV está vacío o no tiene un formato válido."

# Duplicados en carga
→ Si email ya existe: 409 Conflict

# Token de reset expirado
→ "Token inválido o ha expirado."

# Código de empresa inválido
→ "El código de acceso es incorrecto"
```

---

## 🔍 PRUEBAS DE SEGURIDAD

### ✅ Ataques Potenciales

#### 1. User Enumeration en Forgot Password
```bash
POST /api/auth/forgot-password
Body: { email: "no-existe@test.com", codigoAcceso: "ABC123" }

EXPECTATIVA: Respuesta genérica incluso si email no existe
RESULTADO: ✅ "Si el usuario existe y es elegible, se ha enviado..."
```

#### 2. Token Tampering en Reset Password
```bash
POST /api/auth/reset-password
Body: { token: "MANIPULATED_TOKEN", password: "NewPass" }

EXPECTATIVA: Rechazo del token
RESULTADO: ✅ "Token inválido o ha expirado"
```

#### 3. Frontend Filtering Bypass (CRÍTICA)
```bash
GET /api/tickets?empresaId=OTRA_EMPRESA_ID

EXPECTATIVA: Backend debe usar req.usuario.empresaId del JWT
ACTUAL: Retorna tickets de empresaId solicitado ❌
RECOMENDACIÓN: Implementar backend filtering (ver PLAN_IMPLEMENTACION.md)
```

#### 4. Bulk Import con Valores Maliciosos
```bash
CSV:
nombre,correo,password
<script>alert('xss')</script>,test@test.com,pass

EXPECTATIVA: Validación/escaping de entrada
RESULTADO: Verificar en base de datos si se sanitiza
```

---

## 📊 PRUEBAS DE RENDIMIENTO

### ✅ Carga de Datos Grande

#### Prueba 1: Dashboard con 10,000 Tickets
```bash
1. Crear empresa con 10,000 tickets
2. Acceder a dashboard
3. Medir tiempo de carga

EXPECTATIVA: < 2 segundos
PROBLEMA ACTUAL: Frontend filtra todos 10k localmente ⚠️
MEJORA: Backend filtering (ver PLAN_IMPLEMENTACION.md)
```

#### Prueba 2: Carga Masiva Grande
```bash
1. Preparar CSV con 1,000 usuarios
2. POST /api/usuarios/actions/import
3. Medir tiempo

EXPECTATIVA: < 10 segundos
VALIDACIÓN: Todos los usuarios creados
```

---

## 🐛 CHECKLIST DE BUGS CONOCIDOS

- [ ] Problema #1: Filtrado en frontend vs backend
  - **Estado:** Identificado ✅
  - **Solución:** Ver PLAN_IMPLEMENTACION.md
  - **Severidad:** MEDIA-ALTA

- [ ] Problema #2: Carga masiva rechaza todo si hay 1 error
  - **Estado:** Identificado ✅
  - **Solución:** Ver PLAN_IMPLEMENTACION.md
  - **Severidad:** MEDIA

- [ ] Problema #3: Estados de tickets inconsistentes
  - **Estado:** Identificado ✅
  - **Solución:** Ver PLAN_IMPLEMENTACION.md
  - **Severidad:** MEDIA

---

## 📝 REPORTE DE RESULTADOS

### Fecha: ___________
### Tester: ___________

| Sección | Total | Pasadas | Fallidas | Status |
|---------|-------|---------|----------|--------|
| Dashboard Acceso | 3 | ☐ | ☐ | ☐ |
| Métricas | 7 | ☐ | ☐ | ☐ |
| Filtros | 10 | ☐ | ☐ | ☐ |
| Carga Usuarios | 8 | ☐ | ☐ | ☐ |
| Carga Servicios | 5 | ☐ | ☐ | ☐ |
| Carga Habilidades | 4 | ☐ | ☐ | ☐ |
| Olvide Contraseña | 6 | ☐ | ☐ | ☐ |
| Reset Contraseña | 7 | ☐ | ☐ | ☐ |
| Recovery Admin | 5 | ☐ | ☐ | ☐ |
| Endpoints | 8 | ☐ | ☐ | ☐ |
| Seguridad | 4 | ☐ | ☐ | ☐ |
| Rendimiento | 2 | ☐ | ☐ | ☐ |
| **TOTAL** | **69** | **☐** | **☐** | **☐** |

### Observaciones:
```
[Espacio para anotar bugs o comportamientos inesperados]
```

### Firma:
- QA: ___________________
- Fecha: ___________________
- Status Final: ☐ APROBADO ☐ RECHAZADO

---

**Documento Actualizado:** 11 de enero de 2026  
**Versión:** 1.0  
**Próxima Revisión:** 18 de enero de 2026
