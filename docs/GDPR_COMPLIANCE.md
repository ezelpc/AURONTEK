# 🇪🇺 GDPR Compliance Guide - AURONTEK

## 📋 Índice

1. [Introducción](#introducción)
2. [Principios GDPR](#principios-gdpr)
3. [Implementación Actual](#implementación-actual)
4. [Derechos del Usuario](#derechos-del-usuario)
5. [Medidas Técnicas](#medidas-técnicas)
6. [Documentación Requerida](#documentación-requerida)
7. [Checklist de Cumplimiento](#checklist)

---

## 1. 📖 Introducción

### ¿Qué es GDPR?

**GDPR** (General Data Protection Regulation) es el reglamento de protección de datos de la Unión Europea que entró en vigor el 25 de mayo de 2018.

### ¿Aplica a AURONTEK?

✅ **SÍ**, si:
- Tienes usuarios en la UE
- Procesas datos de ciudadanos de la UE
- Ofreces servicios a personas en la UE

### Penalizaciones

- **Tier 1:** Hasta €10M o 2% del revenue global anual
- **Tier 2:** Hasta €20M o 4% del revenue global anual

---

## 2. 📜 Principios GDPR

### 1. Lawfulness, Fairness & Transparency
- ✅ Procesar datos de forma legal y transparente
- ✅ Informar al usuario qué datos se recopilan y por qué

### 2. Purpose Limitation
- ✅ Recopilar datos solo para propósitos específicos
- ❌ No usar datos para otros fines sin consentimiento

### 3. Data Minimization
- ✅ Recopilar solo los datos necesarios
- ❌ No pedir datos innecesarios

### 4. Accuracy
- ✅ Mantener datos actualizados y precisos
- ✅ Permitir corrección de datos

### 5. Storage Limitation
- ✅ Retener datos solo el tiempo necesario
- ✅ Eliminar datos cuando ya no sean necesarios

### 6. Integrity & Confidentiality
- ✅ Proteger datos con medidas técnicas adecuadas
- ✅ Prevenir acceso no autorizado

### 7. Accountability
- ✅ Demostrar cumplimiento
- ✅ Documentar todas las medidas

---

## 3. ✅ Implementación Actual

### 3.1 Datos Personales Recopilados

#### Usuarios
```javascript
{
  nombre: String,           // ✅ Necesario
  correo: String,           // ✅ Necesario
  telefono: String,         // ⚠️  Opcional (minimizar)
  contraseña: String,       // ✅ Hasheado (bcrypt)
  empresa: ObjectId,        // ✅ Necesario
  rol: String,              // ✅ Necesario
  fecha_creacion: Date      // ✅ Necesario
}
```

#### Tickets
```javascript
{
  titulo: String,           // ✅ Necesario
  descripcion: String,      // ✅ Necesario
  usuarioCreador: ObjectId, // ✅ Necesario
  adjuntos: [String]        // ⚠️  Puede contener datos sensibles
}
```

#### Mensajes (Chat)
```javascript
{
  mensaje: String,          // ⚠️  Puede contener datos sensibles
  usuario: ObjectId,        // ✅ Necesario
  adjuntos: [String]        // ⚠️  Puede contener datos sensibles
}
```

### 3.2 Base Legal para Procesamiento

| Dato | Base Legal | Propósito |
|------|------------|-----------|
| Nombre | Contrato | Identificación del usuario |
| Email | Contrato | Autenticación y comunicación |
| Teléfono | Consentimiento | Contacto opcional |
| Contraseña | Contrato | Autenticación |
| Tickets | Contrato | Prestación del servicio |
| Mensajes | Contrato | Soporte técnico |

---

## 4. 👤 Derechos del Usuario

### 4.1 Derecho de Acceso (Art. 15)

**Implementación:**
```typescript
// GET /api/usuarios/me/data
export const getUserData = async (req: Request, res: Response) => {
    const userId = req.usuario.id;
    
    // Recopilar todos los datos del usuario
    const usuario = await Usuario.findById(userId);
    const tickets = await Ticket.find({ usuarioCreador: userId });
    const mensajes = await Mensaje.find({ usuario: userId });
    
    res.json({
        usuario: {
            nombre: usuario.nombre,
            correo: usuario.correo,
            telefono: usuario.telefono,
            fecha_creacion: usuario.fecha_creacion
        },
        tickets: tickets.length,
        mensajes: mensajes.length
    });
};
```

**Estado:** ⚠️  Pendiente de implementar

---

### 4.2 Derecho de Rectificación (Art. 16)

**Implementación:**
```typescript
// PUT /api/usuarios/me
export const updateUserData = async (req: Request, res: Response) => {
    const userId = req.usuario.id;
    const { nombre, telefono } = req.body;
    
    // Permitir actualización de datos personales
    const usuario = await Usuario.findByIdAndUpdate(
        userId,
        { nombre, telefono },
        { new: true }
    );
    
    res.json({ msg: 'Datos actualizados', usuario });
};
```

**Estado:** ✅ Implementado parcialmente

---

### 4.3 Derecho al Olvido (Art. 17)

**Implementación:**
```typescript
// DELETE /api/usuarios/me
export const deleteUserData = async (req: Request, res: Response) => {
    const userId = req.usuario.id;
    
    // Anonimizar en lugar de eliminar (para mantener integridad)
    await Usuario.findByIdAndUpdate(userId, {
        nombre: 'Usuario Eliminado',
        correo: `deleted_${userId}@deleted.com`,
        telefono: null,
        activo: false,
        fecha_eliminacion: new Date()
    });
    
    // Anonimizar tickets
    await Ticket.updateMany(
        { usuarioCreador: userId },
        { usuarioCreador: null }
    );
    
    // Anonimizar mensajes
    await Mensaje.updateMany(
        { usuario: userId },
        { usuario: null, mensaje: '[Mensaje eliminado]' }
    );
    
    res.json({ msg: 'Datos eliminados correctamente' });
};
```

**Estado:** ⚠️  Pendiente de implementar

---

### 4.4 Derecho a la Portabilidad (Art. 20)

**Implementación:**
```typescript
// GET /api/usuarios/me/export
export const exportUserData = async (req: Request, res: Response) => {
    const userId = req.usuario.id;
    
    const usuario = await Usuario.findById(userId);
    const tickets = await Ticket.find({ usuarioCreador: userId });
    const mensajes = await Mensaje.find({ usuario: userId });
    
    const exportData = {
        usuario: usuario.toJSON(),
        tickets: tickets.map(t => t.toJSON()),
        mensajes: mensajes.map(m => m.toJSON()),
        fecha_exportacion: new Date()
    };
    
    // Generar JSON descargable
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=mis-datos.json');
    res.json(exportData);
};
```

**Estado:** ⚠️  Pendiente de implementar

---

### 4.5 Derecho de Oposición (Art. 21)

**Implementación:**
```typescript
// POST /api/usuarios/me/opt-out
export const optOutMarketing = async (req: Request, res: Response) => {
    const userId = req.usuario.id;
    
    await Usuario.findByIdAndUpdate(userId, {
        marketing_consent: false,
        opt_out_date: new Date()
    });
    
    res.json({ msg: 'Preferencias actualizadas' });
};
```

**Estado:** ⚠️  Pendiente de implementar

---

## 5. 🔒 Medidas Técnicas Implementadas

### 5.1 Seguridad de Datos

| Medida | Estado | Descripción |
|--------|--------|-------------|
| Encryption at Rest | ⚠️  Parcial | MongoDB Atlas (encriptado) |
| Encryption in Transit | ✅ Implementado | HTTPS/TLS 1.2+ |
| Password Hashing | ✅ Implementado | bcrypt (10 rounds) |
| Access Control | ✅ Implementado | RBAC + JWT |
| Rate Limiting | ✅ Implementado | 5 intentos/15min |
| Input Sanitization | ✅ Implementado | NoSQL injection prevention |
| CSRF Protection | ✅ Implementado | Token-based |
| Audit Logging | ⚠️  Pendiente | Logs de acceso a datos |

### 5.2 Pseudonimización

**Implementado:**
- ✅ IDs de MongoDB (ObjectId) en lugar de datos personales
- ✅ Contraseñas hasheadas (no reversibles)

**Pendiente:**
- ⚠️  Encriptación de datos sensibles en tickets
- ⚠️  Tokenización de números de teléfono

### 5.3 Minimización de Datos

**Revisar:**
```javascript
// ❌ Evitar recopilar datos innecesarios
telefono: String  // ¿Realmente necesario?
direccion: String // ¿Realmente necesario?
```

**Recomendación:**
- Hacer campos opcionales
- Recopilar solo si el usuario consiente
- Documentar por qué se necesita cada campo

---

## 6. 📄 Documentación Requerida

### 6.1 Privacy Policy (Política de Privacidad)

**Debe incluir:**
- ✅ Qué datos se recopilan
- ✅ Por qué se recopilan
- ✅ Cómo se usan
- ✅ Cuánto tiempo se retienen
- ✅ Con quién se comparten
- ✅ Derechos del usuario
- ✅ Cómo ejercer derechos
- ✅ Información de contacto del DPO

**Ubicación:** `/legal/privacy-policy.md`

**Estado:** ⚠️  Pendiente de crear

---

### 6.2 Terms of Service (Términos de Servicio)

**Debe incluir:**
- ✅ Descripción del servicio
- ✅ Responsabilidades del usuario
- ✅ Limitaciones de responsabilidad
- ✅ Ley aplicable

**Ubicación:** `/legal/terms-of-service.md`

**Estado:** ⚠️  Pendiente de crear

---

### 6.3 Cookie Policy

**Debe incluir:**
- ✅ Qué cookies se usan
- ✅ Para qué se usan
- ✅ Cómo deshabilitarlas

**Cookies actuales:**
```javascript
// CSRF Token
csrfToken: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600000  // 1 hora
}

// Session (JWT en localStorage, no cookie)
```

**Estado:** ⚠️  Pendiente de crear

---

### 6.4 Data Processing Agreement (DPA)

**Para procesadores de datos:**
- MongoDB Atlas
- CloudAMQP
- Cloudinary
- Resend

**Verificar:**
- ✅ Todos tienen DPA disponible
- ⚠️  Firmar DPA con cada uno
- ⚠️  Documentar en registro de procesadores

---

## 7. ✅ Checklist de Cumplimiento

### Documentación Legal

- [ ] Privacy Policy publicada
- [ ] Terms of Service publicados
- [ ] Cookie Policy publicada
- [ ] Consent forms implementados
- [ ] DPA firmados con procesadores

### Derechos del Usuario

- [ ] Derecho de acceso (GET /api/usuarios/me/data)
- [ ] Derecho de rectificación (PUT /api/usuarios/me)
- [ ] Derecho al olvido (DELETE /api/usuarios/me)
- [ ] Derecho a portabilidad (GET /api/usuarios/me/export)
- [ ] Derecho de oposición (POST /api/usuarios/me/opt-out)

### Medidas Técnicas

- [x] HTTPS/TLS
- [x] Password hashing
- [x] Access control (RBAC)
- [x] Rate limiting
- [x] Input sanitization
- [x] CSRF protection
- [ ] Audit logging
- [ ] Data encryption at rest
- [ ] Automated data retention policies

### Procesos

- [ ] Data breach notification procedure
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Registro de actividades de procesamiento
- [ ] Designar Data Protection Officer (DPO)
- [ ] Training del equipo en GDPR

---

## 8. 🚨 Data Breach Procedure

### En caso de violación de datos:

**Paso 1: Contención (0-24h)**
1. Identificar la brecha
2. Contener el daño
3. Documentar todo

**Paso 2: Evaluación (24-48h)**
1. Evaluar impacto
2. Determinar datos afectados
3. Identificar usuarios afectados

**Paso 3: Notificación (72h)**
1. Notificar a autoridad supervisora (DPA)
2. Notificar a usuarios afectados
3. Documentar acciones tomadas

**Contacto DPA España:**
- Agencia Española de Protección de Datos (AEPD)
- https://www.aepd.es
- Email: internacional@aepd.es

---

## 9. 📊 Próximos Pasos

### Prioridad Alta (1-2 meses)

1. **Crear documentación legal**
   - Privacy Policy
   - Terms of Service
   - Cookie Policy

2. **Implementar derechos del usuario**
   - Endpoint de acceso a datos
   - Endpoint de eliminación
   - Endpoint de exportación

3. **Consent management**
   - Banner de cookies
   - Opt-in para marketing
   - Registro de consentimientos

### Prioridad Media (3-6 meses)

1. **Audit logging**
   - Logs de acceso a datos personales
   - Logs de modificaciones
   - Logs de eliminaciones

2. **Data retention policies**
   - Automatizar eliminación de datos viejos
   - Política de retención documentada

3. **Encriptación adicional**
   - Encriptar datos sensibles en DB
   - Tokenización de datos

### Prioridad Baja (6-12 meses)

1. **Certificaciones**
   - ISO 27001
   - SOC 2

2. **DPO**
   - Designar DPO
   - Training del equipo

---

## 📚 Referencias

- [GDPR Official Text](https://gdpr-info.eu/)
- [ICO GDPR Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [AEPD (España)](https://www.aepd.es/)
- [GDPR Checklist](https://gdpr.eu/checklist/)

---

**Última actualización:** 2025-12-23  
**Estado:** En progreso (40% completado)  
**Responsable:** Equipo de Desarrollo AURONTEK
