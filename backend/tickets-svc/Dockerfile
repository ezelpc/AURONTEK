# =============================
# Multi-stage Dockerfile optimizado para producción
# =============================

# --- Etapa 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar si es necesario
RUN npm run build 2>/dev/null || echo "No build script, skipping"

# --- Etapa 2: Producción ---
FROM node:20-alpine AS production

WORKDIR /app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar build o código fuente
COPY --from=builder /app/dist ./dist 2>/dev/null || COPY --from=builder /app/src ./src

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Exponer puerto
EXPOSE 3002

# Variables de entorno
ENV NODE_ENV=production \
    PORT=3002

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Comando de inicio
CMD ["node", "dist/index.js"]
