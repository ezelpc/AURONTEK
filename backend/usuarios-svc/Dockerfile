# =============================
# Multi-stage Dockerfile optimizado para producción
# =============================

# --- Etapa 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# --- Etapa 2: Producción ---
FROM node:20-alpine AS production

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm install --omit=dev && npm cache clean --force

# Copiar build compilado
COPY --from=builder /app/dist ./dist

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Exponer puerto
EXPOSE 3001

# Variables de entorno
ENV NODE_ENV=production \
    PORT=3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Comando de inicio
CMD ["node", "dist/index.js"]
