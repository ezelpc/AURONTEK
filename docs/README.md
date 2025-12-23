# 📖 AURONTEK - Documentación de Producción

## 📋 Índice

1. [Arquitectura](#arquitectura)
2. [Guía de Deployment](#deployment)
3. [GitHub Secrets](#github-secrets)
4. [Configuración de Seguridad](#seguridad)
5. [Mantenimiento](#mantenimiento)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

AURONTEK utiliza una **arquitectura dual-EC2** optimizada para AWS Free Tier:

### EDGE (EC2 Pública)
- **Rol:** Punto de entrada público
- **Servicios:** 
  - Gateway (API Gateway)
  - Redis (Cache + Rate Limiting)
  - Nginx (Reverse Proxy + SSL)
- **IP:** Pública + Privada
- **Memoria:** ~270MB (Gateway 220MB + Redis 50MB)

### CORE (EC2 Privada)
- **Rol:** Capa de negocio
- **Servicios:**
  - usuarios-svc
  - tickets-svc
  - chat-svc
  - notificaciones-svc
  - ia-svc
- **IP:** Solo privada (sin acceso público)
- **Memoria:** ~900MB (5 servicios)

### Flujo de Datos
```
Internet → Nginx (EDGE:443) → Gateway (EDGE:3000) → Microservicios (CORE:3001-3005)
```

---

## 🚀 Deployment

Ver documentación detallada en:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de deployment
- [SETUP_EDGE.md](./SETUP_EDGE.md) - Setup de instancia EDGE
- [SETUP_CORE.md](./SETUP_CORE.md) - Setup de instancia CORE

### Quick Start

1. **Configurar GitHub Secrets** (ver [GITHUB_SECRETS.md](./GITHUB_SECRETS.md))
2. **Ejecutar setup scripts en EC2:**
   ```bash
   # En EDGE
   bash scripts/setup-edge.sh
   
   # En CORE  
   bash scripts/setup-core.sh
   ```
3. **Push a main** → CI/CD automático

---

## 🔐 Seguridad

Ver documentación completa en [SECURITY.md](./SECURITY.md)

### Características Implementadas
- ✅ Rate Limiting (5 intentos/15min en auth)
- ✅ Input Sanitization (NoSQL injection prevention)
- ✅ reCAPTCHA en producción
- ✅ Redis con password
- ✅ Helmet (Security headers)
- ✅ CORS estricto

---

## 🛠️ Mantenimiento

Ver [MAINTENANCE.md](./MAINTENANCE.md) para:
- Monitoreo de recursos
- Logs y debugging
- Backup y recovery
- Actualización de servicios

---

## 📚 Documentos Adicionales

- [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) - Configuración de secretos
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Variables de entorno
- [API_REFERENCE.md](./API_REFERENCE.md) - Referencia de API
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas comunes

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Verificar logs en EC2
3. Contactar al equipo de desarrollo
