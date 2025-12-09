# =============================
# Multi-stage Dockerfile optimizado para Vite + React
# =============================

# --- Etapa 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build con Vite
RUN npm run build

# --- Etapa 2: Producción con Nginx ---
FROM nginx:alpine AS production

# Copiar build de Vite
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 5000
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]