# 🚀 AURONTEK - Sistema de Gestión de Tickets

## 📖 Descripción

AURONTEK es un sistema completo de gestión de tickets empresariales con arquitectura de microservicios, diseñado para optimizar el soporte técnico y la atención al cliente.

### ✨ Características Principales

- 🎫 **Gestión de Tickets** - Sistema completo de tickets con prioridades, estados y asignaciones
- 👥 **Multi-empresa** - Soporte para múltiples empresas con aislamiento de datos
- 🔐 **RBAC** - Control de acceso basado en roles y permisos granulares
- 💬 **Chat en Tiempo Real** - Comunicación instantánea vía WebSockets
- 🤖 **IA Integrada** - Análisis automático y sugerencias inteligentes
- 📧 **Notificaciones** - Emails automáticos vía Resend
- 📊 **Dashboard** - Métricas y estadísticas en tiempo real
- 🌐 **Multi-idioma** - Soporte para español e inglés

---

## 🏗️ Arquitectura

### Dual-EC2 (Optimizado para AWS Free Tier)

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTPS (443)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    EC2 EDGE (Pública)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Nginx   │→ │ Gateway  │→ │  Redis   │                  │
│  │  (SSL)   │  │  (3000)  │  │  (6379)  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                  Private Network
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   EC2 CORE (Privada)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Usuarios │  │ Tickets  │  │   Chat   │                  │
│  │  (3001)  │  │  (3002)  │  │  (3003)  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│  ┌──────────┐  ┌──────────┐                                 │
│  │Notifica- │  │    IA    │                                 │
│  │  ciones  │  │  (3005)  │                                 │
│  │  (3004)  │  └──────────┘                                 │
│  └──────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Gateway** | 3000 | API Gateway, CORS, Rate Limiting |
| **Usuarios** | 3001 | Autenticación, usuarios, empresas, roles |
| **Tickets** | 3002 | CRUD de tickets, asignaciones |
| **Chat** | 3003 | WebSockets, mensajería en tiempo real |
| **Notificaciones** | 3004 | Emails, notificaciones push |
| **IA** | 3005 | Análisis de tickets, sugerencias |
| **Redis** | 6379 | Cache, rate limiting, sesiones |

---

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+
- Docker & Docker Compose
- AWS Account (Free Tier)
- MongoDB Atlas (Free Tier)
- Cloudinary Account
- Resend Account

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/ezelpc/AURONTEK.git
cd AURONTEK

# 2. Instalar dependencias
cd backend/gateway-svc && npm install
cd ../usuarios-svc && npm install
cd ../tickets-svc && npm install
cd ../chat-svc && npm install
cd ../notificaciones-svc && npm install
cd ../ia-svc && pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar servicios
docker-compose -f docker-compose.dev.yml up -d

# 5. Verificar
curl http://localhost:3000/health
```

### Deployment a Producción

Ver documentación completa en [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

```bash
# 1. Configurar GitHub Secrets (ver docs/GITHUB_SECRETS.md)
# 2. Push a main
git push origin main

# 3. CI/CD automáticamente despliega a AWS
```

---

## 📚 Documentación

### Guías Principales

- 📖 [**README**](./docs/README.md) - Índice de documentación
- 🚀 [**Deployment**](./docs/DEPLOYMENT.md) - Guía completa de deployment
- 🔐 [**GitHub Secrets**](./docs/GITHUB_SECRETS.md) - Configuración de secretos
- 🔒 [**Security**](./docs/SECURITY.md) - Guía de seguridad
- 🛠️ [**Maintenance**](./docs/MAINTENANCE.md) - Mantenimiento y monitoreo
- 🆘 [**Troubleshooting**](./docs/TROUBLESHOOTING.md) - Solución de problemas

### Documentación Adicional

- [Variables de Entorno](./docs/ENVIRONMENT_VARIABLES.md)
- [Referencia de API](./docs/API_REFERENCE.md)
- [Setup de SSL](./docs/PRODUCTION_SSL_SETUP.md)
- [Guía de Seeding](./docs/SEEDING_GUIDE.md)

---

## 🔐 Seguridad

### Medidas Implementadas

- ✅ **Rate Limiting** - 5 intentos/15min en auth
- ✅ **Input Sanitization** - Prevención de NoSQL injection
- ✅ **reCAPTCHA** - Protección contra bots
- ✅ **Redis Auth** - Password en Redis
- ✅ **CORS Estricto** - Solo orígenes permitidos
- ✅ **Helmet** - Security headers
- ✅ **HTTPS/TLS** - Certificados Let's Encrypt
- ✅ **bcrypt** - Hashing de passwords

Ver [SECURITY.md](./docs/SECURITY.md) para más detalles.

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime:** Node.js 18, Python 3.9
- **Framework:** Express.js, FastAPI
- **Database:** MongoDB Atlas
- **Message Queue:** RabbitMQ (CloudAMQP)
- **Cache:** Redis
- **Auth:** JWT, bcrypt

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Styling:** TailwindCSS
- **State:** Context API
- **HTTP:** Axios
- **WebSockets:** Socket.IO Client

### DevOps
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **Cloud:** AWS EC2 (Free Tier)
- **Proxy:** Nginx
- **SSL:** Let's Encrypt (Certbot)
- **Registry:** Docker Hub

### Servicios Externos
- **Email:** Resend
- **Storage:** Cloudinary
- **DNS:** No-IP
- **Hosting Frontend:** Vercel

---

## 📊 Métricas

### Performance
- ⚡ Response Time: < 200ms (p95)
- 🚀 Uptime: > 99.5%
- 💾 Memory: ~1.2GB total (EDGE + CORE)

### Seguridad
- 🔒 Rate Limit: 5 intentos/15min
- 🛡️ HTTPS: TLS 1.2/1.3
- 🔐 Password: bcrypt (10 rounds)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'feat: Add AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Convenciones de Commits

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Formateo, sin cambios de código
refactor: Refactorización de código
test: Agregar tests
chore: Mantenimiento
```

---

## 📝 Licencia

Este proyecto es privado y confidencial.

---

## 👥 Equipo

- **Desarrollo:** Ezequiel Perez
- **Arquitectura:** Ezequiel Perez
- **DevOps:** Ezequiel Perez

---

## 📞 Soporte

Para problemas o preguntas:

1. Revisar [Troubleshooting](./docs/TROUBLESHOOTING.md)
2. Verificar [Issues](https://github.com/ezelpc/AURONTEK/issues)
3. Contactar al equipo de desarrollo

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Account lockout (5 intentos)
- [ ] Refresh tokens
- [ ] Schema validation (Zod)
- [ ] CSRF protection

### Q2 2025
- [ ] 2FA para admins
- [ ] WAF (Web Application Firewall)
- [ ] Monitoring avanzado (Grafana)
- [ ] Backup automático

### Q3 2025
- [ ] Mobile app (React Native)
- [ ] API v2
- [ ] Multi-región
- [ ] Compliance (SOC 2)

---

## 🙏 Agradecimientos

- MongoDB Atlas - Database hosting
- Cloudinary - Image storage
- Resend - Email service
- Vercel - Frontend hosting
- AWS - Infrastructure
- Let's Encrypt - SSL certificates

---

<div align="center">

**[Documentación](./docs)** • **[Deployment](./docs/DEPLOYMENT.md)** • **[Security](./docs/SECURITY.md)**

Made with ❤️ by AURONTEK Team

</div>