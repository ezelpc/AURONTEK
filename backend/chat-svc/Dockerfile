# --- Etapa 1: Build (con devDependencies) ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala dependencias completas (dev + prod)
RUN npm install

# Copia el resto del código fuente
COPY . .

# Compila el proyecto
RUN npm run build


# --- Etapa 2: Imagen final (solo producción) ---
FROM node:18-alpine AS runner

WORKDIR /app

# Instala wget para healthcheck
RUN apk add --no-cache wget

# Copia archivos de dependencias
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm install --omit=dev

# Copia la build compilada desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Expone el puerto que usa el servicio
EXPOSE 3003

# Comando de inicio
CMD ["node", "dist/index.js"]