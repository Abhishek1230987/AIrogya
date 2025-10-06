# 🐳 Docker Deployment Guide - AIrogya

## Quick Start

### Prerequisites

- Docker Desktop installed (Windows/Mac)
- Docker Compose v2.0+
- 4GB RAM minimum
- 10GB free disk space

---

## 🚀 One-Command Deployment

### 1. Create Environment File

Create `.env` in the root directory (same folder as `docker-compose.yml`):

```bash
# Copy the example file
cp .env.docker.example .env
```

Then edit `.env` and add your real secrets from `server/.env`:

```env
JWT_SECRET=5lPHC+fOjC9QKXHqVXUM8pSY+VMT5+0nWffZ4cQP716CVjwf0Mmt8f4cdJ3/o0vxt+wBeu3gBJ8QJ0RWJxykYg==
SESSION_SECRET=VeevxPNuQ6hzneNeRd963jLxsIvKoI1WUo7+fzCe1WeJk/5nh2gtAvNjGVGM0v8ut6VtgG5FeMX/eqk8XpwMGg==
GEMINI_API_KEY=AIzaSyCcgAKTiKKbjswOZfDtt9mitsjGGSDA2N0
GOOGLE_CLIENT_ID=1045308773105-pggp7ld70uu695noqk1hv6guflrimv01.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Access Your Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Database:** localhost:5432
- **pgAdmin:** http://localhost:8080 (optional)

---

## 🏗️ What Gets Created

### 4 Containers:

1. **airogya-db** (PostgreSQL 16)

   - Database with all tables auto-created
   - Port: 5432
   - Volume: Persistent data storage

2. **airogya-server** (Node.js Backend)

   - Express API server
   - WebRTC signaling (Socket.IO)
   - Gemini AI integration
   - Port: 5000

3. **airogya-client** (React Frontend)

   - Nginx-served production build
   - Optimized static files
   - Port: 3000 (mapped to Nginx :80)

4. **airogya-pgadmin** (Database GUI - Optional)
   - Web-based PostgreSQL management
   - Port: 8080
   - Only starts with `--profile tools`

---

## 📋 Common Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start with pgAdmin
docker-compose --profile tools up -d

# Start specific service
docker-compose up -d server
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 server
```

### Rebuild Containers

```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build server
```

### Execute Commands Inside Container

```bash
# Access server shell
docker-compose exec server sh

# Access database
docker-compose exec postgres psql -U consultancy_user -d e_consultancy

# Run npm commands
docker-compose exec server npm run test
```

### Check Container Status

```bash
# List running containers
docker-compose ps

# Check container health
docker inspect airogya-server --format='{{.State.Health.Status}}'
```

---

## 🔧 Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker-compose logs server
```

**Common issues:**

- `.env` file missing → Copy from `.env.docker.example`
- Port already in use → Change ports in `docker-compose.yml`
- Build cache issues → Run `docker-compose build --no-cache`

### Database Connection Failed

**Verify database is healthy:**

```bash
docker-compose ps postgres
```

**Check database logs:**

```bash
docker-compose logs postgres
```

**Manual test:**

```bash
docker-compose exec postgres pg_isready -U consultancy_user
```

### Frontend Can't Connect to Backend

**Check environment variables:**

```bash
docker-compose exec client cat /usr/share/nginx/html/index.html | grep VITE
```

**Verify CORS settings in `server/.env`:**

```env
CORS_ORIGIN=http://localhost:3000
```

### Clear Everything and Start Fresh

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker rmi airogya-server airogya-client

# Rebuild from scratch
docker-compose up -d --build
```

---

## 🚀 Production Deployment

### Using Docker Compose on a VPS

1. **Clone repository:**

```bash
git clone https://github.com/Abhishek1230987/AIrogya.git
cd AIrogya
```

2. **Create production `.env`:**

```bash
cp .env.docker.example .env
nano .env  # Edit with production values
```

3. **Update URLs in `.env`:**

```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com
```

4. **Start with production settings:**

```bash
docker-compose up -d --build
```

5. **Setup Nginx reverse proxy** (on host machine):

```nginx
# /etc/nginx/sites-available/airogya
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

6. **Setup SSL with Certbot:**

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## 📊 Monitoring

### Check Resource Usage

```bash
# CPU and Memory
docker stats

# Disk usage
docker system df
```

### Database Backups

```bash
# Backup database
docker-compose exec postgres pg_dump -U consultancy_user e_consultancy > backup.sql

# Restore database
docker-compose exec -T postgres psql -U consultancy_user e_consultancy < backup.sql
```

---

## 🔐 Security Notes

1. **Never commit `.env` file** - It contains secrets
2. **Change default passwords** in production
3. **Use secrets management** for production (Docker Secrets, AWS Secrets Manager)
4. **Enable HTTPS** in production
5. **Restrict database access** - Don't expose port 5432 publicly
6. **Update images regularly** for security patches

---

## 🎯 Development vs Production

### Development (Current Setup)

- All services exposed
- Hot reload disabled (use `npm run dev` locally instead)
- pgAdmin included
- Source maps enabled

### Production Recommendations

- Use environment-specific `.env` files
- Enable HTTPS
- Use managed database (RDS, Cloud SQL)
- Implement logging (ELK stack, CloudWatch)
- Add monitoring (Prometheus, Grafana)
- Use CDN for static assets
- Implement rate limiting
- Setup automated backups

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

---

## ✅ Verification Checklist

After running `docker-compose up -d`, verify:

- [ ] All containers running: `docker-compose ps`
- [ ] Database healthy: `docker-compose exec postgres pg_isready`
- [ ] Server responding: `curl http://localhost:5000/health`
- [ ] Client accessible: Open http://localhost:3000
- [ ] WebSocket working: Test video call feature
- [ ] Database tables created: Check pgAdmin or psql

---

**Your application is now fully containerized! 🐳**
