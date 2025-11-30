# 📚 Documentation Index

Welcome to the AURONTEK CI/CD documentation. This folder contains comprehensive guides for deploying and managing your application.

---

## 📖 Documentation Files

### 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**Complete step-by-step deployment guide** - Start here!

Covers:
- External services setup (MongoDB Atlas, CloudAMQP, Vercel, Docker Hub)
- AWS EC2 instance configuration
- GitHub Secrets configuration
- Complete workflow from dev → test → main
- Troubleshooting common issues

**👉 This is your main resource - follow it sequentially**

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
**Visual architecture overview**

Includes:
- CI/CD pipeline flow diagrams
- Production architecture diagrams
- Resource allocation charts
- Security considerations
- Cost breakdown

**👉 Read this to understand how everything fits together**

---

### ⚡ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Quick command reference**

Contains:
- Common Git workflow commands
- EC2 management commands
- Troubleshooting commands
- Rollback procedures
- Monitoring URLs

**👉 Bookmark this for daily development**

---

## 🎯 Getting Started

### First Time Setup

1. **Read the Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Understand the overall system
   - Review the CI/CD flow
   - Check resource requirements

2. **Follow the Deployment Guide** → [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Set up external services (Part 1)
   - Configure AWS EC2 (Part 2)
   - Set GitHub Secrets (Part 3)
   - Test the pipeline (Part 4)

3. **Keep Quick Reference Handy** → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
   - Use for daily operations
   - Reference for common commands

---

## 🔄 Development Workflow

```bash
# 1. Develop on dev branch
git checkout dev
# ... make changes ...
git push origin dev
# ✅ GitHub Actions builds (CI only)
# ✅ Vercel creates preview deployment

# 2. Test on test branch
git checkout test
git merge dev
git push origin test
# ✅ GitHub Actions builds (CI only)
# ✅ Vercel creates preview deployment

# 3. Deploy to production
git checkout main
git merge test
git push origin main
# 🚀 GitHub Actions builds + deploys to EC2
# 🚀 Vercel deploys to production
```

---

## 📂 Project Structure

```
AURONTEK/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions workflow
├── backend/
│   ├── gateway-svc/
│   ├── usuarios-svc/
│   ├── tickets-svc/
│   ├── chat-svc/
│   ├── notificaciones-svc/
│   └── ia-svc/
├── frontend/                   # React application
├── docs/                       # 📍 You are here
│   ├── README.md              # This file
│   ├── DEPLOYMENT_GUIDE.md    # Full deployment guide
│   ├── ARCHITECTURE.md        # Architecture diagrams
│   └── QUICK_REFERENCE.md     # Command reference
├── scripts/
│   └── setup_ec2.sh           # EC2 setup script
├── docker-compose.yml          # Development
├── docker-compose.prod.yml     # Production (EC2)
└── .env.production.example     # Environment template
```

---

## 🆘 Need Help?

### Common Questions

**Q: How do I deploy to production?**  
A: Merge your changes from `test` to `main` and push. Deployment is automatic.

**Q: Where are my secrets stored?**  
A: In GitHub Settings → Secrets and variables → Actions. Never commit secrets to Git.

**Q: How do I check if my deployment worked?**  
A: 
1. GitHub Actions tab → Check workflow status
2. SSH to EC2 → `docker ps` to see running containers
3. Visit your Vercel URL

**Q: My EC2 instance crashed, what do I do?**  
A: Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) → Part 5: Troubleshooting

### Getting More Help

1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
2. Review GitHub Actions logs for errors
3. SSH to EC2 and check `docker logs -f SERVICE_NAME`
4. Verify all GitHub Secrets are correct

---

## ✅ Checklist

Before going to production, ensure:

- [ ] MongoDB Atlas cluster created and connection string saved
- [ ] CloudAMQP instance created and URL saved
- [ ] Vercel project connected to GitHub
- [ ] Docker Hub account created and token generated
- [ ] EC2 instance launched and setup script executed
- [ ] All GitHub Secrets configured (15+ secrets)
- [ ] Branches created (dev, test, main)
- [ ] Test deployment on dev branch successful
- [ ] Test deployment on test branch successful
- [ ] Production deployment on main branch successful

---

## 📊 Architecture Overview

```
Developer → dev branch → CI (Build) → Vercel Preview
              ↓
         test branch → CI (Build) → Vercel Preview
              ↓
         main branch → CI + CD → EC2 Production + Vercel Production
```

---

## 🎉 Success Criteria

Your pipeline is working correctly when:

- ✅ Pushing to `dev` triggers build (no deploy to EC2)
- ✅ Pushing to `test` triggers build (no deploy to EC2)
- ✅ Pushing to `main` triggers build + deploy to EC2
- ✅ All branches create Vercel preview deployments
- ✅ `main` deploys to Vercel production
- ✅ All 6 services running on EC2 without crashes
- ✅ Frontend can communicate with backend API

---

**Happy Deploying! 🚀**
