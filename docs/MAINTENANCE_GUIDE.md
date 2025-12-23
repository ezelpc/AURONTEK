# Guía de Mantenimiento AURONTEK - Producción EC2

> [!IMPORTANT]
> Esta guía contiene todos los comandos esenciales para mantener y monitorear tu aplicación AURONTEK en producción.

---

## 📊 Monitoreo y Health Checks

### Health Check Completo
```bash
# Ejecutar script de health check
sudo /usr/local/bin/aurontek-health.sh

# O manualmente:
echo "=== Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=== Memory ==="
free -h

echo "=== Disk ==="
df -h

echo "=== API Health ==="
curl http://localhost:3000/health
```

### Monitoreo en Tiempo Real
```bash
# Ver uso de recursos de todos los contenedores
docker stats

# Ver uso de recursos de un servicio específico
docker stats gateway-svc

# Ver logs en tiempo real
docker logs -f gateway-svc

# Ver logs de todos los servicios
docker-compose -f /opt/aurontek/docker-compose.prod.yml logs -f
```

### Ver Estado de Servicios
```bash
# Ver todos los contenedores
docker ps -a

# Ver solo contenedores corriendo
docker ps

# Ver servicios con docker-compose
cd /opt/aurontek
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔄 Gestión de Servicios

### Reiniciar Servicios

```bash
cd /opt/aurontek

# Reiniciar todos los servicios
docker-compose -f docker-compose.prod.yml restart

# Reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart gateway-svc

# Reiniciar múltiples servicios
docker-compose -f docker-compose.prod.yml restart gateway-svc usuarios-svc
```

### Detener Servicios

```bash
cd /opt/aurontek

# Detener todos los servicios
docker-compose -f docker-compose.prod.yml stop

# Detener un servicio específico
docker-compose -f docker-compose.prod.yml stop gateway-svc

# Detener y eliminar contenedores (mantiene volúmenes)
docker-compose -f docker-compose.prod.yml down
```

### Iniciar Servicios

```bash
cd /opt/aurontek

# Iniciar todos los servicios
docker-compose -f docker-compose.prod.yml up -d

# Iniciar un servicio específico
docker-compose -f docker-compose.prod.yml up -d gateway-svc

# Iniciar con rebuild (si hay cambios)
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🔍 Logs y Debugging

### Ver Logs

```bash
# Logs de un servicio (últimas 100 líneas)
docker logs --tail 100 gateway-svc

# Logs en tiempo real
docker logs -f gateway-svc

# Logs con timestamp
docker logs -t gateway-svc

# Logs desde hace X tiempo
docker logs --since 1h gateway-svc
docker logs --since 30m usuarios-svc

# Logs entre fechas
docker logs --since "2025-12-19T00:00:00" --until "2025-12-19T23:59:59" gateway-svc
```

### Buscar en Logs

```bash
# Buscar errores
docker logs gateway-svc 2>&1 | grep -i error

# Buscar warnings
docker logs gateway-svc 2>&1 | grep -i warn

# Buscar patrón específico
docker logs gateway-svc 2>&1 | grep "MongoDB"

# Contar errores
docker logs gateway-svc 2>&1 | grep -i error | wc -l
```

### Logs del Sistema

```bash
# Ver logs de Nginx (si está configurado)
sudo tail -f /var/log/nginx/aurontek_access.log
sudo tail -f /var/log/nginx/aurontek_error.log

# Ver logs del sistema
sudo journalctl -u docker -f
```

---

## 🔄 Actualización y Deployment

### Actualizar desde GitHub (CI/CD)

El CI/CD automático se activa con cada push a `main`. Para forzar un deployment:

```bash
# Desde tu máquina local
git push origin main
```

### Actualización Manual

```bash
cd /opt/aurontek

# 1. Pull de nuevas imágenes
docker-compose -f docker-compose.prod.yml pull

# 2. Recrear contenedores con nuevas imágenes
docker-compose -f docker-compose.prod.yml up -d

# 3. Limpiar imágenes antiguas
docker image prune -af
```

### Rollback a Versión Anterior

```bash
cd /opt/aurontek

# Ver imágenes disponibles
docker images | grep aurontek

# Editar .env para cambiar IMAGE_TAG
nano .env
# Cambiar: IMAGE_TAG=latest a IMAGE_TAG=<commit-sha>

# Recrear servicios con imagen anterior
docker-compose -f docker-compose.prod.yml up -d

# Restaurar a latest
# Cambiar de nuevo IMAGE_TAG=latest y repetir
```

---

## 🧹 Limpieza y Optimización

### Limpiar Recursos Docker

```bash
# Limpiar imágenes no usadas (RECOMENDADO - ejecutar semanalmente)
docker image prune -af

# Limpiar contenedores detenidos
docker container prune -f

# Limpiar volúmenes no usados (¡CUIDADO! Puede borrar datos)
docker volume prune -f

# Limpiar todo (imágenes, contenedores, redes, volúmenes)
# ⚠️ PELIGROSO - Solo si sabes lo que haces
docker system prune -af --volumes
```

### Liberar Espacio en Disco

```bash
# Ver uso de disco
df -h

# Ver espacio usado por Docker
docker system df

# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d

# Limpiar archivos temporales
sudo apt-get clean
sudo apt-get autoclean
```

### Optimizar Memoria

```bash
# Ver uso de memoria
free -h

# Ver procesos que más consumen
top
# O más amigable:
htop

# Ver memoria por contenedor
docker stats --no-stream
```

---

## 🔐 Seguridad y Backups

### Backup de Variables de Entorno

```bash
# Backup del archivo .env
cd /opt/aurontek
sudo cp .env .env.backup.$(date +%Y%m%d)

# Ver backups
ls -lh .env.backup.*
```

### Verificar Certificados SSL

```bash
# Ver certificados instalados
sudo certbot certificates

# Renovar certificados manualmente
sudo certbot renew

# Test de renovación (dry-run)
sudo certbot renew --dry-run

# Ver fecha de expiración
sudo certbot certificates | grep "Expiry Date"
```

### Verificar Nginx

```bash
# Estado de Nginx
sudo systemctl status nginx

# Verificar configuración
sudo nginx -t

# Recargar configuración (sin downtime)
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/aurontek_error.log
```

---

## 🚨 Troubleshooting

### Servicio No Responde

```bash
# 1. Ver estado del contenedor
docker ps -a | grep <servicio>

# 2. Ver logs para errores
docker logs --tail 50 <servicio>

# 3. Verificar health check
docker inspect <servicio> | grep -A 10 Health

# 4. Reiniciar servicio
docker-compose -f /opt/aurontek/docker-compose.prod.yml restart <servicio>

# 5. Si persiste, recrear contenedor
docker-compose -f /opt/aurontek/docker-compose.prod.yml up -d --force-recreate <servicio>
```

### Memoria Llena

```bash
# 1. Ver qué consume memoria
docker stats --no-stream

# 2. Limpiar imágenes no usadas
docker image prune -af

# 3. Reiniciar servicios con alto consumo
docker-compose -f /opt/aurontek/docker-compose.prod.yml restart <servicio>

# 4. Ver memoria del sistema
free -h
top
```

### Disco Lleno

```bash
# 1. Ver uso de disco
df -h

# 2. Ver qué ocupa espacio en Docker
docker system df

# 3. Limpiar Docker
docker system prune -af

# 4. Limpiar logs
sudo journalctl --vacuum-time=7d

# 5. Ver archivos grandes
sudo du -h /opt/aurontek | sort -rh | head -20
```

### Conexión a MongoDB Falla

```bash
# 1. Verificar variable de entorno
docker exec gateway-svc env | grep MONGODB_URI

# 2. Test de conexión desde contenedor
docker exec -it usuarios-svc sh
# Dentro del contenedor:
wget -qO- http://localhost:3001/health

# 3. Verificar en MongoDB Atlas
# - Network Access: Whitelist 0.0.0.0/0 o IP de EC2
# - Database Access: Usuario y contraseña correctos
```

### Gateway No Responde

```bash
# 1. Verificar que está corriendo
docker ps | grep gateway

# 2. Ver logs
docker logs --tail 100 gateway-svc

# 3. Verificar Redis
docker exec gateway-svc sh -c "wget -qO- http://redis:6379"

# 4. Reiniciar gateway
docker-compose -f /opt/aurontek/docker-compose.prod.yml restart gateway-svc

# 5. Test de health
curl http://localhost:3000/health
```

---

## 📈 Comandos de Monitoreo Avanzado

### Inspeccionar Contenedor

```bash
# Ver configuración completa
docker inspect gateway-svc

# Ver solo variables de entorno
docker inspect gateway-svc | grep -A 50 Env

# Ver límites de recursos
docker inspect gateway-svc | grep -A 10 Memory

# Ver redes
docker inspect gateway-svc | grep -A 10 Networks
```

### Ejecutar Comandos Dentro del Contenedor

```bash
# Abrir shell interactivo
docker exec -it gateway-svc sh

# Ejecutar comando único
docker exec gateway-svc ls -la

# Ver variables de entorno
docker exec gateway-svc env

# Ver procesos
docker exec gateway-svc ps aux
```

### Monitoreo de Red

```bash
# Ver puertos expuestos
docker port gateway-svc

# Ver conexiones activas
sudo netstat -tlnp | grep docker

# Test de conectividad entre servicios
docker exec gateway-svc ping usuarios-svc
docker exec gateway-svc wget -qO- http://usuarios-svc:3001/health
```

---

## ⏰ Tareas de Mantenimiento Programadas

### Diarias (Automatizar con cron)

```bash
# Health check
sudo /usr/local/bin/aurontek-health.sh

# Verificar logs por errores
docker logs --since 24h gateway-svc 2>&1 | grep -i error
```

### Semanales

```bash
# Limpiar imágenes no usadas
docker image prune -af

# Verificar espacio en disco
df -h

# Revisar uso de memoria
free -h
docker stats --no-stream
```

### Mensuales

```bash
# Actualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Verificar certificados SSL
sudo certbot certificates

# Backup de configuración
cd /opt/aurontek
sudo tar -czf ~/aurontek-backup-$(date +%Y%m%d).tar.gz .env docker-compose.prod.yml
```

---

## 🔧 Configuración de Cron para Automatización

```bash
# Editar crontab
crontab -e

# Agregar tareas automáticas:

# Health check diario a las 2 AM
0 2 * * * /usr/local/bin/aurontek-health.sh >> /var/log/aurontek-health.log 2>&1

# Limpiar imágenes Docker semanalmente (domingos a las 3 AM)
0 3 * * 0 docker image prune -af >> /var/log/docker-cleanup.log 2>&1

# Renovación de certificados SSL (ya configurado por setup-ssl.sh)
0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'
```

---

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## 🆘 Comandos de Emergencia

### Reinicio Completo del Sistema

```bash
# ⚠️ Solo en caso de emergencia
cd /opt/aurontek
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Reinicio del Servidor EC2

```bash
# ⚠️ Causará downtime
sudo reboot
```

### Restaurar desde Backup

```bash
# Restaurar .env desde backup
cd /opt/aurontek
sudo cp .env.backup.YYYYMMDD .env

# Recrear servicios
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 📊 Tabla de Referencia Rápida

| Acción | Comando |
|--------|---------|
| Ver logs en vivo | `docker logs -f <servicio>` |
| Reiniciar servicio | `docker-compose -f /opt/aurontek/docker-compose.prod.yml restart <servicio>` |
| Ver uso de recursos | `docker stats` |
| Limpiar imágenes | `docker image prune -af` |
| Health check | `curl http://localhost:3000/health` |
| Ver contenedores | `docker ps` |
| Actualizar servicios | `docker-compose -f /opt/aurontek/docker-compose.prod.yml pull && docker-compose -f /opt/aurontek/docker-compose.prod.yml up -d` |
| Ver espacio en disco | `df -h` |
| Ver memoria | `free -h` |
| Estado de Nginx | `sudo systemctl status nginx` |

---

## 💡 Tips de Optimización

1. **Ejecuta `docker image prune -af` semanalmente** para liberar espacio
2. **Monitorea `docker stats`** regularmente para detectar fugas de memoria
3. **Revisa logs diariamente** para detectar problemas temprano
4. **Mantén backups** de tu archivo `.env`
5. **Documenta cambios** que hagas manualmente en producción
