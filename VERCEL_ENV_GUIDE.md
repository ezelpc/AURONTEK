# Variables de Entorno de Vercel - AURONTEK Frontend

> [!IMPORTANT]
> Estas variables deben configurarse en **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**

## 📋 Variables Requeridas

### 1. API Backend

| Variable | Descripción | Ejemplo | Ambiente |
|----------|-------------|---------|----------|
| `VITE_API_URL` | URL del backend (Gateway) | `https://aurontekhq-api.ddns.net/api` | Production, Preview, Development |

> [!WARNING]
> **NO incluyas `/` al final**. Usa `https://aurontekhq-api.ddns.net/api` NO `https://aurontekhq-api.ddns.net/api/`

---

### 2. WebSocket (Opcional)

| Variable | Descripción | Ejemplo | Ambiente |
|----------|-------------|---------|----------|
| `VITE_SOCKET_URL` | URL para WebSocket (chat, notificaciones) | `https://aurontekhq-api.ddns.net` | Production, Preview, Development |

> [!NOTE]
> Si no se configura, usa `window.location.origin` por defecto.

---

### 3. Google reCAPTCHA

| Variable | Descripción | Ejemplo | Ambiente |
|----------|-------------|---------|----------|
| `VITE_RECAPTCHA_SITE_KEY` | Site Key (pública) de reCAPTCHA v2 | `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` | Production, Preview, Development |

**Dónde obtenerlo:**
1. [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Selecciona tu sitio
3. Copia la **Site Key** (NO la Secret Key)

> [!TIP]
> La Site Key es pública y segura de exponer en el frontend.

---

### 4. Cloudinary (Para subida de imágenes)

| Variable | Descripción | Ejemplo | Ambiente |
|----------|-------------|---------|----------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Nombre de tu cloud de Cloudinary | `aurontek-cloud` | Production, Preview, Development |

**Dónde obtenerlo:**
1. [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copia el **Cloud Name**

---

### 5. Contraseña Admin (Opcional - Para desarrollo)

| Variable | Descripción | Ejemplo | Ambiente |
|----------|-------------|---------|----------|
| `VITE_AURONTEK_ADMIN_PASSWORD` | Contraseña para acciones admin sensibles | `aurontek2024` | Development |

> [!CAUTION]
> Solo para desarrollo. En producción, usa autenticación real.

---

## 🔧 Cómo Configurar en Vercel

### Opción 1: Via Dashboard (Recomendado)

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto AURONTEK
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable:
   - **Key**: Nombre de la variable (ej: `VITE_API_URL`)
   - **Value**: Valor de la variable
   - **Environments**: Selecciona Production, Preview, Development

5. Haz **Save**
6. **Redeploy** tu aplicación para que tome efecto

---

### Opción 2: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Configurar variables
vercel env add VITE_API_URL production
# Ingresa el valor cuando te lo pida

vercel env add VITE_RECAPTCHA_SITE_KEY production
vercel env add VITE_CLOUDINARY_CLOUD_NAME production
vercel env add VITE_SOCKET_URL production

# Redeploy
vercel --prod
```

---

## ✅ Checklist de Configuración

### Obligatorias
- [ ] `VITE_API_URL` - URL del backend
- [ ] `VITE_RECAPTCHA_SITE_KEY` - Site Key de reCAPTCHA
- [ ] `VITE_CLOUDINARY_CLOUD_NAME` - Cloud Name de Cloudinary

### Opcionales
- [ ] `VITE_SOCKET_URL` - URL de WebSocket (si difiere del API)
- [ ] `VITE_AURONTEK_ADMIN_PASSWORD` - Solo para desarrollo

---

## 🔍 Verificar Configuración

Después de configurar las variables:

1. **Redeploy** tu aplicación en Vercel
2. Abre la consola del navegador en tu sitio
3. Verifica que las variables estén disponibles:

```javascript
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_RECAPTCHA_SITE_KEY);
console.log(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
```

---

## 📝 Ejemplo Completo

```env
# Production Environment Variables en Vercel

VITE_API_URL=https://aurontekhq-api.ddns.net/api
VITE_SOCKET_URL=https://aurontekhq-api.ddns.net
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_CLOUDINARY_CLOUD_NAME=aurontek-cloud
```

---

## ⚠️ Errores Comunes

### Error: "API URL is undefined"
- **Causa**: `VITE_API_URL` no configurado o mal escrito
- **Solución**: Verifica que el nombre sea exacto (case-sensitive) y redeploy

### Error: "reCAPTCHA site key is invalid"
- **Causa**: Usando Secret Key en lugar de Site Key
- **Solución**: Usa la **Site Key** (pública), NO la Secret Key

### Error: "Changes not taking effect"
- **Causa**: No hiciste redeploy después de cambiar variables
- **Solución**: Haz redeploy desde Vercel Dashboard o CLI

---

## 🔗 Referencias

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [Cloudinary Dashboard](https://cloudinary.com/console)

---

## 💡 Tips

1. **Usa diferentes valores para Preview/Development**: Puedes configurar diferentes API URLs para testing
2. **No expongas secrets**: Solo variables con prefijo `VITE_` son seguras para el frontend
3. **Documenta tus variables**: Mantén esta lista actualizada cuando agregues nuevas variables
