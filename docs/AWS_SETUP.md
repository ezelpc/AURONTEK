# ☁️ Guía de AWS - AURONTEK

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [EC2 Instances](#ec2-instances)
3. [Security Groups](#security-groups)
4. [Elastic IPs](#elastic-ips)
5. [Monitoreo](#monitoreo)
6. [Costos](#costos)

---

## 1. 🚀 Configuración Inicial

### 1.1 Crear Cuenta AWS

1. Ir a https://aws.amazon.com
2. Click en "Create an AWS Account"
3. Completar información:
   - Email
   - Password
   - Account name
4. Información de contacto
5. **Método de pago** (tarjeta de crédito requerida)
6. Verificación de identidad (SMS o llamada)
7. Seleccionar plan: **Basic Support (Free)**

### 1.2 Configurar Free Tier

**AWS Free Tier incluye:**
- ✅ 750 horas/mes de EC2 t2.micro (12 meses)
- ✅ 30 GB de EBS storage
- ✅ 15 GB de bandwidth saliente
- ✅ 1 GB de snapshots

**⚠️ Importante:**
- Usar **SOLO t2.micro** (otras instancias cobran)
- Máximo **2 instancias** corriendo 24/7
- Monitorear uso mensual

---

## 2. 🖥️ EC2 Instances

### 2.1 Crear EC2 EDGE (Pública)

#### Paso 1: Launch Instance

1. AWS Console → EC2 → Launch Instance
2. **Name:** `AURONTEK-EDGE`
3. **Application and OS Images:**
   - Ubuntu Server 22.04 LTS
   - 64-bit (x86)
   - Free tier eligible ✅

#### Paso 2: Instance Type

- **Type:** `t2.micro`
- **vCPUs:** 1
- **Memory:** 1 GiB
- ✅ Free tier eligible

#### Paso 3: Key Pair

1. Click "Create new key pair"
2. **Name:** `aurontek-key`
3. **Type:** RSA
4. **Format:** .pem (para Linux/Mac) o .ppk (para PuTTY)
5. Download y guardar en lugar seguro
6. **Permisos:**
   ```bash
   chmod 400 aurontek-key.pem
   ```

#### Paso 4: Network Settings

- **VPC:** Default
- **Subnet:** No preference
- **Auto-assign public IP:** Enable ✅
- **Firewall (Security Group):** Create new
  - **Name:** `aurontek-edge-sg`
  - **Description:** Security group for EDGE instance

#### Paso 5: Configure Storage

- **Size:** 8 GiB (mínimo)
- **Type:** gp3 (General Purpose SSD)
- **Delete on termination:** Yes ✅

#### Paso 6: Advanced Details

- **User data:** (opcional, para auto-setup)
  ```bash
  #!/bin/bash
  apt-get update
  apt-get upgrade -y
  ```

#### Paso 7: Launch

1. Review y click "Launch instance"
2. Esperar ~2 minutos
3. Anotar **Public IPv4 address**

---

### 2.2 Crear EC2 CORE (Privada)

#### Repetir pasos 1-7 con estos cambios:

- **Name:** `AURONTEK-CORE`
- **Auto-assign public IP:** Disable ❌
- **Security Group:** Create new
  - **Name:** `aurontek-core-sg`
- **Key pair:** Usar la misma (`aurontek-key`)

#### Anotar:
- **Private IPv4 address** (ej: 172.31.10.21)

---

## 3. 🔒 Security Groups

### 3.1 EDGE Security Group

#### Inbound Rules

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Mi IP | SSH desde mi computadora |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP público |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS público |
| Custom TCP | TCP | 6379 | aurontek-core-sg | Redis desde CORE |

**Configurar:**
1. EC2 → Security Groups → `aurontek-edge-sg`
2. Inbound rules → Edit inbound rules
3. Add rule para cada fila de la tabla
4. Para "Mi IP": Click en dropdown y seleccionar "My IP"
5. Para CORE SG: Buscar `aurontek-core-sg` en Source

#### Outbound Rules

| Type | Protocol | Port | Destination | Description |
|------|----------|------|-------------|-------------|
| All traffic | All | All | 0.0.0.0/0 | Permitir todo saliente |

---

### 3.2 CORE Security Group

#### Inbound Rules

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | aurontek-edge-sg | SSH desde EDGE |
| Custom TCP | TCP | 3001 | aurontek-edge-sg | usuarios-svc |
| Custom TCP | TCP | 3002 | aurontek-edge-sg | tickets-svc |
| Custom TCP | TCP | 3003 | aurontek-edge-sg | chat-svc |
| Custom TCP | TCP | 3004 | aurontek-edge-sg | notificaciones-svc |
| Custom TCP | TCP | 3005 | aurontek-edge-sg | ia-svc |

**Configurar:**
1. EC2 → Security Groups → `aurontek-core-sg`
2. Inbound rules → Edit inbound rules
3. Add rule para cada puerto
4. Source: Seleccionar `aurontek-edge-sg`

#### Outbound Rules

| Type | Protocol | Port | Destination | Description |
|------|----------|------|-------------|-------------|
| All traffic | All | All | 0.0.0.0/0 | Permitir todo saliente |

---

## 4. 🌐 Elastic IPs (Opcional)

### ¿Por qué usar Elastic IP?

- ✅ IP pública **fija** (no cambia al reiniciar)
- ✅ Gratis si está **asociada** a una instancia corriendo
- ⚠️ **Cobra** si está reservada pero no asociada

### Crear Elastic IP para EDGE

1. EC2 → Elastic IPs → Allocate Elastic IP address
2. **Network Border Group:** Default
3. Click "Allocate"
4. Seleccionar la IP → Actions → Associate Elastic IP address
5. **Instance:** Seleccionar `AURONTEK-EDGE`
6. Click "Associate"

### Actualizar No-IP

1. Ir a https://www.noip.com
2. Login → My Services → DNS records
3. Modificar `aurontekhq-api.ddns.net`
4. **Target:** Nueva Elastic IP
5. Save

---

## 5. 📊 Monitoreo

### 5.1 CloudWatch (Gratis)

#### Métricas Básicas

1. EC2 → Instances → Seleccionar instancia
2. Tab "Monitoring"
3. Ver:
   - CPU Utilization
   - Network In/Out
   - Disk Read/Write

#### Crear Alarma

1. CloudWatch → Alarms → Create alarm
2. **Metric:** EC2 → Per-Instance Metrics → CPUUtilization
3. **Instance:** Seleccionar EDGE o CORE
4. **Condition:**
   - Threshold type: Static
   - Greater than: 80
5. **Actions:**
   - Send notification to: Crear nuevo SNS topic
   - Email: tu-email@example.com
6. Create alarm

### 5.2 Billing Alerts

1. Billing → Billing preferences
2. ✅ Receive Free Tier Usage Alerts
3. ✅ Receive Billing Alerts
4. Email: tu-email@example.com
5. Save preferences

#### Crear Alarma de Costo

1. CloudWatch → Alarms → Billing
2. Create alarm
3. **Metric:** Total Estimated Charge
4. **Threshold:** $5 (o tu límite)
5. **Action:** Email notification
6. Create alarm

---

## 6. 💰 Costos

### 6.1 Estimación Mensual

#### Dentro de Free Tier (12 meses)

| Servicio | Uso | Costo |
|----------|-----|-------|
| 2x EC2 t2.micro | 1,500h/mes | $0 |
| 30 GB EBS | Storage | $0 |
| 15 GB Bandwidth | Saliente | $0 |
| **TOTAL** | | **$0/mes** |

#### Después de Free Tier

| Servicio | Uso | Costo |
|----------|-----|-------|
| 2x EC2 t2.micro | 730h/mes | ~$16.80 |
| 30 GB EBS | Storage | ~$3.00 |
| 15 GB Bandwidth | Saliente | ~$1.35 |
| **TOTAL** | | **~$21/mes** |

### 6.2 Optimización de Costos

#### ✅ Hacer

- Usar **t2.micro** exclusivamente
- **Apagar** instancias cuando no se usen (dev/test)
- Usar **Elastic IP** solo si es necesario
- **Eliminar** snapshots viejos
- **Monitorear** uso mensual

#### ❌ Evitar

- Instancias más grandes (t2.small, t2.medium)
- Elastic IPs sin asociar
- Snapshots innecesarios
- Bandwidth excesivo
- Múltiples regiones

---

## 7. 🔧 Comandos Útiles

### Conectar a EC2

```bash
# EDGE (con IP pública)
ssh -i aurontek-key.pem ubuntu@EDGE_PUBLIC_IP

# CORE (desde EDGE)
ssh -i aurontek-key.pem ubuntu@EDGE_PUBLIC_IP
ssh ubuntu@CORE_PRIVATE_IP
```

### Copiar Archivos

```bash
# Local → EDGE
scp -i aurontek-key.pem archivo.txt ubuntu@EDGE_PUBLIC_IP:/home/ubuntu/

# EDGE → CORE
scp archivo.txt ubuntu@CORE_PRIVATE_IP:/home/ubuntu/
```

### Monitoreo

```bash
# Ver uso de CPU
top

# Ver uso de memoria
free -h

# Ver uso de disco
df -h

# Ver procesos de Docker
docker ps
docker stats
```

---

## 8. 🆘 Troubleshooting

### No puedo conectar por SSH

**Problema:** `Connection refused` o `Connection timed out`

**Soluciones:**
1. Verificar Security Group permite SSH desde tu IP
2. Verificar instancia está corriendo (State: running)
3. Verificar IP pública es correcta
4. Verificar permisos de llave: `chmod 400 aurontek-key.pem`

### Instancia muy lenta

**Problema:** CPU al 100%

**Soluciones:**
1. Ver procesos: `top`
2. Reiniciar servicios pesados
3. Agregar swap si falta memoria
4. Considerar upgrade (fuera de Free Tier)

### Cargos inesperados

**Problema:** Billing muestra cargos

**Verificar:**
1. Billing → Bills → Ver detalles
2. Instancias corriendo (solo 2x t2.micro)
3. Elastic IPs sin asociar
4. Snapshots viejos
5. Bandwidth excedido

---

## 📚 Referencias

- [AWS Free Tier](https://aws.amazon.com/free/)
- [EC2 Pricing](https://aws.amazon.com/ec2/pricing/)
- [Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [CloudWatch](https://docs.aws.amazon.com/cloudwatch/)
