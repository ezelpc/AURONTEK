# Dockerfile
# --- Etapa 1: Build (instala dependencias) ---
FROM node:18-alpine AS builder
WORKDIR /app

# Instalar pnpm (tu pipeline lo usaba)
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# --- Etapa 2: Runner ---
FROM node:18-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm
RUN apk add --no-cache wget

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3002

CMD ["pnpm", "run", "start"]
