# TTR-AURONTEK

Sistema Integral de Gestión de Tickets y Servicios IT.

## 🚀 Arquitectura
El sistema consta de una arquitectura de microservicios (Backend) y una SPA moderna (Frontend).

### Estructura
-   **`backend/`**: Microservicios (Usuarios, Tickets, Chat, Notificaciones, IA) y API Gateway.
-   **`frontend/`**: SPA desarrollada con Vite, React, TypeScript y Shadcn/UI.
-   **`docs/`**: Documentación técnica y guías de despliegue.

## 🛠️ Desarrollo Local
1.  **Backend**:
    ```bash
    docker-compose -f docker-compose.dev.yml up -d --build
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 📚 Documentación
-   [Comandos Docker](docs/DOCKER_COMMANDS.md)
-   [Guía de Variables de Entorno](docs/ENVS_GUIDE.md)
-   [Workflow de Despliegue Configurado](.github/workflows/ci-cd.yml)

## 📦 Despliegue
-   **Backend**: Automático a AWS EC2 vía GitHub Actions al hacer push a `main`.
-   **Frontend**: Despliegue continuo en Vercel (Configurado via Dashboard).