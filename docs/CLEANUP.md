# Guía de Limpieza del Proyecto y Configuración del Frontend

## 🎯 Objetivo

1. Eliminar código innecesario del proyecto
2. Configurar el frontend para que use **SOLO** variables de `.env`
3. Asegurar que no haya URLs hardcodeadas

---

## 📋 Archivos que Necesitan Corrección

### ✅ YA CORREGIDOS

1. **frontend/src/services/authService.js** ✅
   - Cambiado de: `'http://localhost:3000/api/admin-sistema/login'`
   - A: `` `${process.env.REACT_APP_API_URL}/api/admin-sistema/login` ``

2. **frontend/src/pages/ForgotPassword.jsx** ✅
   - Cambiado de: `'http://localhost:3000/api/usuario/forgot-password'`
   - A: `` `${process.env.REACT_APP_API_URL}/api/usuario/forgot-password` ``

3. **frontend/src/api/api.js** ✅
   - Ya usa correctamente: `process.env.REACT_APP_API_URL`

### ⚠️ PENDIENTES DE CORRECCIÓN

4. **frontend/src/services/empresaService.js** ⚠️
   - **Línea 97**: Cambiar `baseURL: 'http://localhost:3000/api'`
   - **A**: `` baseURL: `${process.env.REACT_APP_API_URL}/api` ``
   
   ```javascript
   // ANTES:
   const api = axios.create({
     baseURL: 'http://localhost:3000/api',
     headers: {
       'Content-Type': 'application/json'
     }
   });

   // DESPUÉS:
   const api = axios.create({
     baseURL: `${process.env.REACT_APP_API_URL}/api`,
     headers: {
       'Content-Type': 'application/json'
     }
   });
   ```

5. **frontend/src/pages/RegistrarEmpresa.jsx** ⚠️
   - **Línea 98**: Cambiar `'http://localhost:3000/api/admin/empresas/enviar-credenciales'`
   - **A**: `` `${process.env.REACT_APP_API_URL}/api/admin/empresas/enviar-credenciales` ``
   
   ```javascript
   // ANTES:
   await fetch('http://localhost:3000/api/admin/empresas/enviar-credenciales', {
     method: 'POST',
     // ...
   });

   // DESPUÉS:
   await fetch(`${process.env.REACT_APP_API_URL}/api/admin/empresas/enviar-credenciales`, {
     method: 'POST',
     // ...
   });
   ```

6. **frontend/src/pages/ResetPassword.jsx** ⚠️
   - **Línea 24**: Cambiar `'http://localhost:3000/api/usuario/reset-password'`
   - **A**: `` `${process.env.REACT_APP_API_URL}/api/usuario/reset-password` ``
   
   ```javascript
   // ANTES:
   const res = await fetch('http://localhost:3000/api/usuario/reset-password', {
     method: 'POST',
     // ...
   });

   // DESPUÉS:
   const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuario/reset-password`, {
     method: 'POST',
     // ...
   });
   ```

---

## 🔧 Configuración del .env

### Frontend (.env)

Crear/actualizar el archivo `frontend/.env`:

```env
# API Gateway URL (sin /api al final)
REACT_APP_API_URL=http://localhost:3000

# ReCaptcha Key (opcional, para producción)
REACT_APP_RECAPTCHA_KEY=your_recaptcha_key_here
```

### Frontend (.env.example) ✅ YA CREADO

Ya existe el archivo `frontend/.env.example` con la plantilla correcta.

### Diferentes Ambientes

**Desarrollo Local:**
```env
REACT_APP_API_URL=http://localhost:3000
```

**Producción:**
```env
REACT_APP_API_URL=https://api.tudominio.com
REACT_APP_RECAPTCHA_KEY=tu_clave_real_de_recaptcha
```

---

## 🧹 Archivos a Eliminar/Limpiar

### Backend

1. **Archivos de debug:**
   - `backend/usuarios-svc/src/debug_login.ts` (si existe)
   - Cualquier archivo `*.debug.js` o `*.test.old.js`

2. **Código comentado:**
   - Revisar todos los archivos `.js/.ts` y eliminar bloques grandes de código comentado

3. **Console.logs innecesarios:**
   - Buscar y eliminar `console.log` de desarrollo
   - Mantener solo los necesarios para producción

### Frontend

1. **Componentes no usados:**
   - Revisar `frontend/src/components/` y eliminar componentes sin uso

2. **Console.logs:**
   - Eliminar `console.log` de desarrollo
   - Usar solo en casos necesarios

3. **Imports no usados:**
   - Ejecutar linter para detectar imports sin uso

---

## 📝 Pasos para Aplicar Correcciones

### 1. Corregir empresaService.js

```bash
# Abrir el archivo
code frontend/src/services/empresaService.js

# Buscar línea 97 y cambiar:
# DE:   baseURL: 'http://localhost:3000/api',
# A:    baseURL: `${process.env.REACT_APP_API_URL}/api`,
```

### 2. Corregir RegistrarEmpresa.jsx

```bash
# Abrir el archivo
code frontend/src/pages/RegistrarEmpresa.jsx

# Buscar línea 98 y cambiar:
# DE:   await fetch('http://localhost:3000/api/admin/empresas/enviar-credenciales', {
# A:    await fetch(`${process.env.REACT_APP_API_URL}/api/admin/empresas/enviar-credenciales`, {
```

### 3. Corregir ResetPassword.jsx

```bash
# Abrir el archivo
code frontend/src/pages/ResetPassword.jsx

# Buscar línea 24 y cambiar:
# DE:   const res = await fetch('http://localhost:3000/api/usuario/reset-password', {
# A:    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuario/reset-password`, {
```

### 4. Verificar que no hay más URLs hardcodeadas

```bash
# Buscar en todo el frontend
cd frontend
grep -r "http://localhost:3000" src/
grep -r "http://localhost:3001" src/
grep -r "http://localhost:3002" src/

# No debería encontrar nada después de las correcciones
```

### 5. Actualizar .env

```bash
# Crear/actualizar frontend/.env
echo "REACT_APP_API_URL=http://localhost:3000" > frontend/.env
echo "REACT_APP_RECAPTCHA_KEY=your_recaptcha_key_here" >> frontend/.env
```

### 6. Probar el Frontend

```bash
cd frontend
npm start

# Verificar en consola del navegador que:
# - No hay errores de conexión
# - Las peticiones van a la URL correcta
# - process.env.REACT_APP_API_URL tiene el valor correcto
```

---

## ✅ Checklist de Verificación

Después de aplicar las correcciones:

- [ ] No hay URLs hardcodeadas en el código
- [ ] Archivo `.env` existe y tiene las variables correctas
- [ ] Archivo `.env.example` existe como plantilla
- [ ] Frontend inicia sin errores
- [ ] Las peticiones HTTP van a la URL del .env
- [ ] Se puede cambiar la URL solo modificando el .env
- [ ] No hay console.logs innecesarios
- [ ] No hay código comentado en exceso
- [ ] No hay archivos de debug

---

## 🔍 Comando para Buscar URLs Hardcodeadas

```bash
# Desde la raíz del proyecto
cd frontend/src

# Buscar localhost hardcodeado
grep -rn "localhost:" . --include="*.js" --include="*.jsx"

# Buscar http:// hardcodeado
grep -rn "http://" . --include="*.js" --include="*.jsx" | grep -v "process.env"

# Buscar https:// hardcodeado
grep -rn "https://" . --include="*.js" --include="*.jsx" | grep -v "process.env"
```

---

## 🚀 Resultado Esperado

Después de aplicar todas las correcciones:

1. **Cambiar ambiente** solo requiere modificar `.env`
2. **No hay URLs hardcodeadas** en el código
3. **Fácil deployment** a diferentes ambientes
4. **Código limpio** sin debug ni comentarios excesivos

---

## 📌 Notas Importantes

- **NUNCA** commitear el archivo `.env` (ya está en `.gitignore`)
- **SIEMPRE** mantener `.env.example` actualizado
- **DOCUMENTAR** todas las variables de entorno necesarias
- **VALIDAR** que `process.env.REACT_APP_API_URL` no sea `undefined`

---

**Última actualización:** 2024-12-07
