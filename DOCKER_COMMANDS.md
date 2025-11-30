# 🐳 Docker Compose Commands

## Development Environment

### Start all services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stop all services
```bash
docker-compose -f docker-compose.dev.yml down
```

### View logs
```bash
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.dev.yml logs -f gateway-svc
```

### Rebuild after code changes
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

### Clean everything (including volumes)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

## Test Environment

### Start all services
```bash
docker-compose -f docker-compose.test.yml up -d
```

### Stop all services
```bash
docker-compose -f docker-compose.test.yml down
```

### View logs
```bash
docker-compose -f docker-compose.test.yml logs -f
```

### Rebuild and test
```bash
docker-compose -f docker-compose.test.yml up -d --build
```

### Clean everything
```bash
docker-compose -f docker-compose.test.yml down -v
```

---

## Production (EC2 Only)

Production uses external MongoDB Atlas and CloudAMQP services.

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Services Access

### Development (localhost)
- Gateway: http://localhost:3000
- Usuarios: http://localhost:3001
- Tickets: http://localhost:3002
- Chat: http://localhost:3003
- Notificaciones: http://localhost:3004
- IA: http://localhost:8000
- MongoDB: mongodb://admin:admin123@localhost:27017
- RabbitMQ Management: http://localhost:15672 (admin/admin123)
- Redis: localhost:6379

### Test (localhost)
- Gateway: http://localhost:4000
- Usuarios: http://localhost:4001
- Tickets: http://localhost:4002
- Chat: http://localhost:4003
- Notificaciones: http://localhost:4004
- IA: http://localhost:8001
- MongoDB: mongodb://test:test123@localhost:27018
- RabbitMQ Management: http://localhost:15673 (test/test123)
- Redis: localhost:6380

---

## Troubleshooting

### "Port already in use"
Different ports are used for dev and test environments to avoid conflicts.

### Check service health
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Restart specific service
```bash
docker-compose -f docker-compose.dev.yml restart gateway-svc
```

### Access container shell
```bash
docker exec -it gateway-svc-dev sh
```
