# =============================
# 🔹 Etapa 1: Build
# =============================
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos del servicio
COPY package*.json ./
COPY .babelrc ./

# Instalar dependencias (solo lo necesario para build)
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar con Babel
RUN npm run build

# =============================
# 🔹 Etapa 2: Producción
# =============================
FROM node:20-alpine AS production

WORKDIR /app

# Copiar solo los archivos compilados y dependencias de producción
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Instalar solo dependencias necesarias en producción
RUN npm install --omit=dev

# Copiar el .env si se monta externo o definir variable
# (si lo vas a montar desde tu máquina, no copies el archivo)
# COPY ../.env .env

EXPOSE 3001

# Comando de inicio
CMD ["node", "dist/index.js"]
