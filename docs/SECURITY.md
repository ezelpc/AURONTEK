# 🔒 Guía de Seguridad - AURONTEK

## 📋 Índice

1. [Resumen de Seguridad](#resumen)
2. [Medidas Implementadas](#medidas-implementadas)
3. [Configuración](#configuracion)
4. [Best Practices](#best-practices)
5. [Auditoría](#auditoria)

---

## 🛡️ Resumen

AURONTEK implementa múltiples capas de seguridad para proteger contra:
- ✅ Brute Force Attacks
- ✅ NoSQL Injection
- ✅ XSS (Cross-Site Scripting)
- ✅ CSRF (Cross-Site Request Forgery)
- ✅ DDoS (Distributed Denial of Service)
- ✅ Man-in-the-Middle Attacks

**Nivel de Seguridad:** ALTO

---

## 🔐 Medidas Implementadas

### 1. Rate Limiting

**Ubicación:** `backend/gateway-svc/src/middleware/rate-limit.ts`

**Configuración:**
```typescript
// Auth endpoints: 5 intentos por 15 minutos
authLimiter: {
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true
}

// General API: 100 requests por 15 minutos
generalLimiter: {
    windowMs: 15 * 60 * 1000,
    limit: 100
}
```

**Protege contra:**
- ❌ Brute force en login
- ❌ Credential stuffing
- ❌ DDoS básico

---

### 2. Input Sanitization

**Ubicación:** `backend/gateway-svc/src/middleware/sanitize.ts`

**Tecnologías:**
- `express-mongo-sanitize` - Previene NoSQL injection
- `validator` - Validación y sanitización de inputs

**Funciones:**
```typescript
sanitizeEmail(email)      // Valida y normaliza emails
sanitizeString(str)       // Escapa HTML
sanitizeAccessCode(code)  // Solo alfanuméricos
```

**Protege contra:**
- ❌ NoSQL injection (`{"$ne": null}`)
- ❌ XSS (`<script>alert('xss')</script>`)
- ❌ Path traversal (`../../etc/passwd`)

---

### 3. reCAPTCHA

**Ubicación:** `backend/usuarios-svc/src/Controllers/auth.controller.ts`

**Configuración:**
```typescript
// Solo en producción
if (process.env.NODE_ENV === 'production') {
    await verificarRecaptcha(recaptchaToken);
}
```

**Protege contra:**
- ❌ Bots automatizados
- ❌ Scraping
- ❌ Spam

---

### 4. Redis Authentication

**Ubicación:** `docker-compose.edge.yml`

**Configuración:**
```yaml
redis:
  command: >
    redis-server 
    --requirepass ${REDIS_PASSWORD}
```

**Protege contra:**
- ❌ Acceso no autorizado a caché
- ❌ Manipulación de rate limits
- ❌ Robo de sesiones

---

### 5. CORS Estricto

**Ubicación:** `backend/gateway-svc/src/app.ts`

**Configuración:**
```typescript
cors({
    origin: (origin, callback) => {
        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            callback(null, origin);  // Origin específico
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
})
```

**Protege contra:**
- ❌ Requests desde dominios no autorizados
- ❌ CSRF básico

---

### 6. Helmet (Security Headers)

**Ubicación:** `backend/gateway-svc/src/app.ts`

**Headers Agregados:**
```
Content-Security-Policy
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

**Protege contra:**
- ❌ Clickjacking
- ❌ MIME sniffing
- ❌ XSS reflejado

---

### 7. HTTPS/TLS

**Ubicación:** Nginx + Let's Encrypt

**Configuración:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:...';
```

**Protege contra:**
- ❌ Man-in-the-Middle
- ❌ Eavesdropping
- ❌ Packet sniffing

---

### 8. Password Hashing

**Ubicación:** `backend/usuarios-svc/src/Utils/hash.utils.ts`

**Tecnología:** bcrypt con salt rounds = 10

```typescript
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);
```

**Protege contra:**
- ❌ Rainbow table attacks
- ❌ Password cracking
- ❌ Database leaks

---

## ⚙️ Configuración

### Variables de Entorno Críticas

```bash
# Seguridad
JWT_SECRET=<256-bit-secret>
SERVICE_TOKEN=<256-bit-secret>
REDIS_PASSWORD=<192-bit-secret>
RECAPTCHA_SECRET_KEY=<google-recaptcha-key>

# Generar secrets seguros
openssl rand -base64 32  # JWT_SECRET, SERVICE_TOKEN
openssl rand -base64 24  # REDIS_PASSWORD
```

### Security Groups (AWS)

**EDGE SG:**
```
Inbound:
  22 (SSH) → Tu IP
  80 (HTTP) → 0.0.0.0/0
  443 (HTTPS) → 0.0.0.0/0
  6379 (Redis) → CORE SG ONLY

Outbound:
  All traffic
```

**CORE SG:**
```
Inbound:
  22 (SSH) → EDGE SG
  3001-3005 → EDGE SG

Outbound:
  All traffic
```

---

## 📋 Best Practices

### 1. Gestión de Secrets

✅ **DO:**
- Usar GitHub Secrets para CI/CD
- Rotar secrets cada 90 días
- Generar con `openssl rand`
- Usar secrets diferentes por entorno

❌ **DON'T:**
- Commitear secrets en código
- Compartir por email/Slack
- Reutilizar entre servicios
- Usar valores por defecto

### 2. Passwords

✅ **DO:**
- Mínimo 12 caracteres
- Incluir mayúsculas, minúsculas, números, símbolos
- Usar password manager
- Habilitar 2FA donde sea posible

❌ **DON'T:**
- Usar passwords comunes
- Reutilizar passwords
- Compartir passwords
- Guardar en texto plano

### 3. SSH Keys

✅ **DO:**
- Usar llaves de 4096 bits
- Proteger con passphrase
- Permisos 600 (`chmod 600`)
- Una llave por persona

❌ **DON'T:**
- Compartir llaves privadas
- Commitear llaves
- Usar llaves sin passphrase
- Permisos incorrectos

### 4. API Keys

✅ **DO:**
- Usar variables de entorno
- Rotar regularmente
- Limitar permisos (least privilege)
- Monitorear uso

❌ **DON'T:**
- Hardcodear en código
- Usar en frontend
- Dar permisos excesivos
- Ignorar alertas de uso

---

## 🔍 Auditoría

### Checklist de Seguridad

#### Autenticación
- [x] Rate limiting en login (5/15min)
- [x] reCAPTCHA habilitado
- [x] Passwords hasheados (bcrypt)
- [ ] Account lockout (5 intentos) - PENDIENTE
- [ ] 2FA - PENDIENTE

#### Autorización
- [x] JWT con expiración
- [x] Validación de roles
- [x] Service-to-service auth
- [ ] Refresh tokens - PENDIENTE

#### Input Validation
- [x] NoSQL injection prevention
- [x] Email validation
- [x] String sanitization
- [ ] Schema validation (Joi/Zod) - PENDIENTE

#### Network Security
- [x] HTTPS/TLS
- [x] CORS estricto
- [x] Security headers (Helmet)
- [x] Redis authentication
- [x] Security Groups configurados

#### Monitoring
- [ ] Logging de intentos fallidos - PENDIENTE
- [ ] Alertas de seguridad - PENDIENTE
- [ ] Audit trail - PENDIENTE

---

## 🚨 Respuesta a Incidentes

### Sospecha de Compromiso

1. **Inmediato:**
   ```bash
   # Rotar todos los secrets
   # Revisar logs de acceso
   # Bloquear IPs sospechosas
   ```

2. **Investigación:**
   ```bash
   # Revisar logs de GitHub Actions
   # Revisar logs de EC2
   docker logs gateway-svc | grep "401\|403\|500"
   
   # Revisar conexiones activas
   netstat -an | grep ESTABLISHED
   ```

3. **Mitigación:**
   ```bash
   # Cambiar passwords
   # Revocar API keys
   # Actualizar Security Groups
   # Forzar logout de usuarios
   ```

### Contactos de Emergencia

- **DevOps Lead:** [email]
- **Security Team:** [email]
- **AWS Support:** [enlace]

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

---

## 🔄 Próximas Mejoras

### Prioridad Alta
- [ ] Implementar account lockout
- [ ] Agregar schema validation (Joi/Zod)
- [ ] Implementar CSRF protection
- [ ] Logging de eventos de seguridad

### Prioridad Media
- [ ] Refresh tokens
- [ ] 2FA para admins
- [ ] Rate limiting en Nginx
- [ ] WAF (Web Application Firewall)

### Prioridad Baja
- [ ] Penetration testing
- [ ] Bug bounty program
- [ ] Security training
- [ ] Compliance audit (SOC 2, ISO 27001)
