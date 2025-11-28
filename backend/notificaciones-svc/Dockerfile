# --- Etapa 1: Build (instala dependencias) ---
FROM node:18-alpine AS builder

WORKDIR /app

# Instala pnpm globalmente
RUN npm install -g pnpm

# Copia los archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instala dependencias (todas, para asegurar que build/start funcionen)
RUN pnpm install --frozen-lockfile

# Copia el resto del código fuente
COPY . .

# Notificaciones no requiere build


# --- Etapa 2: Final (producción) ---
FROM node:18-alpine AS runner

WORKDIR /app

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala wget para healthcheck
RUN apk add --no-cache wget

# Copia archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instala solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copia el código desde el builder
COPY --from=builder /app .

# Expone el puerto del servicio
EXPOSE 3004

# Comando de inicio
CMD ["pnpm", "run", "start"]