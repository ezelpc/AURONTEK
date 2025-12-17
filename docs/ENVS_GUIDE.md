# Guía de Variables de Entorno para Producción

## Frontend (Vercel)
Configurar estas variables en el Dashboard del Proyecto en Vercel.

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del Gateway en EC2 | `http://<IP-EC2>:3000` |

## Backend (EC2 / CI-CD)
Estas variables deben estar configuradas en los **Secrets de GitHub** para que el pipeline de CI/CD las inyecte.

| Secret Name | Descripción |
|-------------|-------------|
| `DOCKER_USERNAME` | Usuario de DockerHub |
| `DOCKER_PASSWORD` | Token de acceso de DockerHub |
| `EC2_HOST` | IP Pública o DNS del servidor EC2 |
| `EC2_USERNAME` | Usuario SSH (ej. ubuntu) |
| `EC2_SSH_KEY` | Llave privada SSH (contenido del .pem) |
| `MONGODB_URI` | URI de conexión a MongoDB Atlas |
| `REDIS_URL` | URI de Redis (ej. `redis://redis:6379` o managed) |
| `RABBITMQ_URL` | URI de RabbitMQ (CloudAMQP) |
| `JWT_SECRET` | Secreto para firmar tokens |
| `SERVICE_TOKEN` | Token para comunicación entre microservicios (IA) |
| `CLOUDINARY_*` | Credenciales de Cloudinary |
| `EMAIL_*` | Credenciales SMTP |
| `FRONTEND_URL` | URL del frontend (Vercel) para CORS |

## Notas
- El archivo `docker-compose.prod.yml` usa `redis://redis:6379` por defecto. Si usas un Redis externo en AWS (ElastiCache), actualiza el secreto `REDIS_URL`.
