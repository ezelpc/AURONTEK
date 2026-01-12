# Configuración de Variables de Entorno para Producción

## Problema Identificado

El frontend en producción (Vercel) está intentando conectarse a `localhost:3003` y `localhost:3004` para los WebSockets de chat y notificaciones, lo que causa errores de conexión.

## Arquitectura

- **Frontend:** Desplegado en Vercel
- **Backend:** Desplegado en AWS EC2 (dual EC2) con dominio No-IP y SSL

## Solución

Debes configurar las siguientes variables de entorno en **Vercel** apuntando a tu dominio de AWS:

### Variables Requeridas

```bash
VITE_CHAT_URL=https://tu-dominio-noip.ddns.net
VITE_NOTIFICATIONS_URL=https://tu-dominio-noip.ddns.net
```

### Pasos para Configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_CHAT_URL` | `https://tu-dominio-noip.ddns.net` | Production, Preview, Development |
| `VITE_NOTIFICATIONS_URL` | `https://tu-dominio-noip.ddns.net` | Production, Preview, Development |

4. **Importante:** Después de agregar las variables, debes hacer un **Redeploy** del frontend para que los cambios surtan efecto.

### Ejemplo de Configuración

Si tu dominio No-IP es `aurontek.ddns.net`, las variables serían:

```bash
VITE_CHAT_URL=https://aurontek.ddns.net
VITE_NOTIFICATIONS_URL=https://aurontek.ddns.net
```

### Verificación del Backend

Asegúrate de que tu backend en AWS EC2 tenga:

1. **Nginx configurado** para hacer proxy de WebSocket a los puertos 3003 y 3004
2. **SSL/TLS activo** (Certbot con Let's Encrypt)
3. **Puertos abiertos** en el Security Group de AWS:
   - Puerto 443 (HTTPS)
   - Puerto 80 (HTTP - redirect a HTTPS)

### Configuración de Nginx para WebSocket

Tu Nginx debe tener algo similar a esto:

```nginx
# Chat Service (puerto 3003)
location /socket.io/ {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### Verificación

Después del redeploy, verifica en la consola del navegador que las conexiones WebSocket apunten a tu dominio AWS en lugar de `localhost`.

### Para Desarrollo Local

Si quieres probar localmente, crea un archivo `.env` en la raíz del frontend con:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_GATEWAY_URL=http://localhost:3000
VITE_CHAT_URL=http://localhost:3003
VITE_NOTIFICATIONS_URL=http://localhost:3004
```

**Nota:** El archivo `.env` no debe ser commiteado al repositorio (ya está en `.gitignore`).

## Troubleshooting

Si después de configurar las variables sigues viendo errores:

1. Verifica que hiciste **Redeploy** en Vercel
2. Limpia la caché del navegador
3. Verifica que los servicios de chat y notificaciones estén corriendo en AWS EC2
4. Revisa los logs de Nginx en AWS para ver si las peticiones WebSocket están llegando

