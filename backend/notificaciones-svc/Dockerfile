# =============================
# Multi-stage Dockerfile optimizado para producción
# =============================

# --- Etapa 1: Build/Preparación ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Este servicio no requiere compilación, es JavaScript puro

# --- Etapa 2: Producción ---
FROM node:20-alpine AS production

WORKDIR /app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm install --omit=dev && npm cache clean --force

# Copiar código fuente
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.js ./index.js 2>/dev/null || echo "No index.js"

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Exponer puerto
EXPOSE 3004

# Variables de entorno
ENV NODE_ENV=production \
    PORT=3004

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Comando de inicio
CMD ["npm", "run", "start"]