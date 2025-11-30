# 🚀 Quick Reference - CI/CD Commands

## Common Git Workflow

```bash
# 1. Develop on dev branch
git checkout dev
git pull origin dev
# ... make changes ...
git add .
git commit -m "feat: description"
git push origin dev
# → Triggers CI build only

# 2. Move to test for testing
git checkout test
git pull origin test
git merge dev
git push origin test
# → Triggers CI build only

# 3. Deploy to production
git checkout main
git pull origin main
git merge test
git push origin main
# → Triggers CI + DEPLOY to EC2 🚀
```

## EC2 Management Commands

```bash
# Connect to EC2
ssh -i aurontek-key.pem ubuntu@YOUR_EC2_IP

# Navigate to app directory
cd /opt/aurontek

# View running containers
docker ps

# View logs (all services)
docker-compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker logs -f gateway-svc

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart gateway-svc

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Pull latest images manually
docker-compose -f docker-compose.prod.yml pull

# Clean old images
docker image prune -af

# Monitor resources
free -h          # Memory usage
htop             # CPU + processes
df -h            # Disk usage
swapon --show    # Swap usage
```

## Troubleshooting Commands

```bash
# Check if swap is active
swapon --show

# Check service health
curl http://localhost:3000/health  # Gateway
curl http://localhost:3001/health  # Usuarios
curl http://localhost:3002/health  # Tickets
curl http://localhost:3003/health  # Chat
curl http://localhost:3004/health  # Notificaciones
curl http://localhost:3005/health  # IA

# Check environment variables
docker exec gateway-svc env | grep MONGODB_URI

# Restart Docker daemon
sudo systemctl restart docker

# View Docker networks
docker network ls
docker network inspect aurontek_default
```

## Rollback Commands

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main
# → Auto-deploys previous version

# Option 2: Deploy specific version
# On EC2:
cd /opt/aurontek
nano .env
# Change: IMAGE_TAG=abc123 (previous commit SHA)
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## GitHub Secrets (Reference)

These secrets must be configured in GitHub Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `EC2_HOST` | EC2 public IP address |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | Full content of `.pem` file |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `RABBITMQ_URL` | CloudAMQP connection URL |
| `JWT_SECRET` | Random secret string |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret |
| `CLOUDINARY_*` | Cloudinary credentials |
| `EMAIL_*` | SMTP email configuration |

## Monitoring URLs

- **Frontend (Vercel):**
  - Dev: `https://aurontek-dev-xxx.vercel.app`
  - Test: `https://aurontek-test-xxx.vercel.app`
  - Prod: `https://aurontek.vercel.app`

- **Backend (EC2):**
  - API Gateway: `http://YOUR_EC2_IP:3000`
  - Health Check: `http://YOUR_EC2_IP:3000/health`

- **Docker Hub:**
  - `https://hub.docker.com/u/YOUR_USERNAME`

- **GitHub Actions:**
  - Your repo → Actions tab

## Branch Strategy

```
dev (development)
  ↓ merge
test (testing/QA)
  ↓ merge
main (production) → AUTO-DEPLOY to EC2
```

## Service Ports

- `3000` - Gateway (Public-facing API)
- `3001` - Usuarios
- `3002` - Tickets
- `3003` - Chat
- `3004` - Notificaciones
- `3005` - IA

## Memory Limits (per service)

- Node.js services: 150MB each
- IA service (Python): 200MB
- Total: ~1GB (within t2.micro limits with swap)
