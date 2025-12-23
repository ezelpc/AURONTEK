# 🛠️ Guía de Mantenimiento - AURONTEK

## 📋 Índice

1. [Monitoreo](#monitoreo)
2. [Logs](#logs)
3. [Backups](#backups)
4. [Actualizaciones](#actualizaciones)
5. [Optimización](#optimizacion)
6. [Troubleshooting](#troubleshooting)

---

## 📊 Monitoreo

### 1. Recursos del Sistema

#### Memoria
```bash
# Ver uso de memoria
free -h

# Ver uso por contenedor
docker stats

# Alerta si memoria > 80%
free | grep Mem | awk '{print ($3/$2) * 100.0}' | awk '{if ($1 > 80) print "⚠️  Memoria alta: " $1"%"}'
```

#### Disco
```bash
# Ver espacio disponible
df -h

# Ver uso de Docker
docker system df

# Limpiar imágenes viejas
docker image prune -af
```

#### CPU
```bash
# Ver carga del sistema
uptime

# Ver procesos por CPU
top -o %CPU

# Ver uso por contenedor
docker stats --no-stream
```

### 2. Health Checks

#### Script de Monitoreo
```bash
#!/bin/bash
# health-check.sh

echo "🏥 Health Check - $(date)"

# EDGE
echo "📡 EDGE Services:"
curl -s http://localhost:3000/health || echo "❌ Gateway DOWN"
docker exec redis redis-cli -a $REDIS_PASSWORD ping || echo "❌ Redis DOWN"

# CORE (desde EDGE)
echo "📡 CORE Services:"
curl -s http://$CORE_PRIVATE_IP:3001/health || echo "❌ Usuarios DOWN"
curl -s http://$CORE_PRIVATE_IP:3002/health || echo "❌ Tickets DOWN"
curl -s http://$CORE_PRIVATE_IP:3003/health || echo "❌ Chat DOWN"
curl -s http://$CORE_PRIVATE_IP:3004/health || echo "❌ Notificaciones DOWN"
curl -s http://$CORE_PRIVATE_IP:3005/health || echo "❌ IA DOWN"

echo "✅ Health check complete"
```

#### Cron Job (Cada 5 minutos)
```bash
# Editar crontab
crontab -e

# Agregar línea
*/5 * * * * /opt/aurontek/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## 📝 Logs

### 1. Ver Logs

#### Docker Logs
```bash
# Tiempo real
docker logs -f gateway-svc

# Últimas 100 líneas
docker logs --tail 100 gateway-svc

# Con timestamps
docker logs -t gateway-svc

# Desde hace 1 hora
docker logs --since 1h gateway-svc
```

#### Nginx Logs
```bash
# Access log
tail -f /var/log/nginx/aurontek_access.log

# Error log
tail -f /var/log/nginx/aurontek_error.log

# Filtrar errores 5xx
grep " 5[0-9][0-9] " /var/log/nginx/aurontek_access.log
```

#### System Logs
```bash
# Ver logs del sistema
journalctl -xe

# Logs de Docker daemon
journalctl -u docker

# Logs de Nginx
journalctl -u nginx
```

### 2. Rotación de Logs

#### Docker (ya configurado)
```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

#### Nginx
```bash
# Configurar logrotate
sudo nano /etc/logrotate.d/nginx

# Contenido:
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## 💾 Backups

### 1. MongoDB (Atlas)

**Automático:** MongoDB Atlas hace backups automáticos

**Manual:**
```bash
# Exportar colección
mongodump --uri="$MONGODB_URI" --collection=usuarios --out=/backup/$(date +%Y%m%d)

# Restaurar
mongorestore --uri="$MONGODB_URI" --collection=usuarios /backup/20250123/usuarios.bson
```

### 2. Configuración

```bash
# Backup de configuración
tar -czf backup-config-$(date +%Y%m%d).tar.gz \
    /opt/aurontek/docker-compose.edge.yml \
    /opt/aurontek/docker-compose.core.yml \
    /opt/aurontek/.env \
    /etc/nginx/sites-available/aurontek.conf

# Restaurar
tar -xzf backup-config-20250123.tar.gz -C /
```

### 3. Certificados SSL

```bash
# Backup de certificados
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz \
    /etc/letsencrypt

# Restaurar
sudo tar -xzf letsencrypt-backup-20250123.tar.gz -C /
```

---

## 🔄 Actualizaciones

### 1. Actualizar Servicios

#### Actualización Normal (CI/CD)
```bash
# 1. Hacer cambios en código
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin main

# 2. CI/CD automáticamente:
#    - Construye imágenes
#    - Pushea a Docker Hub
#    - Despliega en EDGE y CORE
```

#### Actualización Manual
```bash
# EDGE
cd /opt/aurontek
docker compose -f docker-compose.edge.yml pull
docker compose -f docker-compose.edge.yml up -d --force-recreate

# CORE
cd /opt/aurontek
docker compose -f docker-compose.core.yml pull
docker compose -f docker-compose.core.yml up -d --force-recreate
```

### 2. Actualizar Sistema Operativo

```bash
# Actualizar paquetes
sudo apt update
sudo apt upgrade -y

# Reiniciar si es necesario
sudo reboot

# Verificar servicios después del reinicio
docker ps
systemctl status nginx
```

### 3. Actualizar Docker

```bash
# Ver versión actual
docker --version

# Actualizar
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Reiniciar Docker
sudo systemctl restart docker

# Verificar
docker ps
```

---

## ⚡ Optimización

### 1. Memoria

#### Limpiar Caché
```bash
# Limpiar caché de sistema
sudo sync; echo 3 | sudo tee /proc/sys/vm/drop_caches

# Limpiar Docker
docker system prune -af
docker volume prune -f
```

#### Ajustar Swap
```bash
# Ver uso de swap
swapon --show

# Ajustar swappiness (0-100, menor = menos swap)
sudo sysctl vm.swappiness=10

# Hacer permanente
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 2. Disco

```bash
# Encontrar archivos grandes
sudo find / -type f -size +100M -exec ls -lh {} \;

# Limpiar logs viejos
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# Limpiar apt cache
sudo apt clean
sudo apt autoclean
```

### 3. Red

```bash
# Ver conexiones activas
netstat -an | grep ESTABLISHED | wc -l

# Ver puertos en uso
sudo netstat -tulpn

# Optimizar TCP (opcional)
sudo sysctl -w net.ipv4.tcp_fin_timeout=30
sudo sysctl -w net.ipv4.tcp_keepalive_time=1200
```

---

## 🔧 Mantenimiento Programado

### Diario
- [ ] Revisar health checks
- [ ] Verificar uso de memoria/disco
- [ ] Revisar logs de errores

### Semanal
- [ ] Limpiar imágenes Docker viejas
- [ ] Revisar logs de seguridad
- [ ] Verificar backups

### Mensual
- [ ] Actualizar sistema operativo
- [ ] Revisar y optimizar queries de DB
- [ ] Analizar métricas de performance
- [ ] Revisar certificados SSL (renovación)

### Trimestral
- [ ] Rotar secrets
- [ ] Auditoría de seguridad
- [ ] Revisar costos de AWS
- [ ] Actualizar dependencias

---

## 📈 Métricas Clave

### KPIs de Sistema

| Métrica | Objetivo | Alerta |
|---------|----------|--------|
| Uptime | > 99.5% | < 99% |
| Memoria EDGE | < 700MB | > 800MB |
| Memoria CORE | < 900MB | > 950MB |
| Disco | < 80% | > 90% |
| Response Time | < 200ms | > 500ms |

### Comandos de Monitoreo
```bash
# Uptime
uptime

# Memoria
free -h | grep Mem | awk '{print "Uso: " ($3/$2)*100 "%"}'

# Disco
df -h / | tail -1 | awk '{print "Uso: " $5}'

# Response time
curl -w "@curl-format.txt" -o /dev/null -s https://aurontekhq-api.ddns.net/health
```

---

## 🚨 Alertas

### Configurar Alertas (Opcional)

#### UptimeRobot (Gratis)
1. Crear cuenta en uptimerobot.com
2. Agregar monitor:
   - URL: `https://aurontekhq-api.ddns.net/health`
   - Intervalo: 5 minutos
3. Configurar alertas por email

#### Script de Alertas
```bash
#!/bin/bash
# alert.sh

THRESHOLD_MEM=80
THRESHOLD_DISK=90

# Verificar memoria
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ $MEM_USAGE -gt $THRESHOLD_MEM ]; then
    echo "⚠️  Memoria alta: ${MEM_USAGE}%" | mail -s "ALERTA: Memoria" admin@aurontek.com
fi

# Verificar disco
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | cut -d% -f1)
if [ $DISK_USAGE -gt $THRESHOLD_DISK ]; then
    echo "⚠️  Disco lleno: ${DISK_USAGE}%" | mail -s "ALERTA: Disco" admin@aurontek.com
fi
```

---

## 📚 Referencias

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Performance Tuning](https://www.nginx.com/blog/tuning-nginx/)
- [AWS EC2 Monitoring](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring_ec2.html)
- [Linux Performance](https://www.brendangregg.com/linuxperf.html)
