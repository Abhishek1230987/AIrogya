# E-Consultancy - Production Deployment Guide

## 🚀 Complete Deployment Checklist

This guide covers **environment setup, security hardening, WebRTC configuration, and deployment** for the E-Consultancy platform.

---

## 📋 Table of Contents

1. [Environment Variables Setup](#environment-variables-setup)
2. [Security Configuration](#security-configuration)
3. [WebRTC & Video Conferencing](#webrtc--video-conferencing)
4. [Database Setup](#database-setup)
5. [Docker Deployment](#docker-deployment)
6. [Production Build](#production-build)
7. [Deployment Platforms](#deployment-platforms)
8. [Post-Deployment](#post-deployment)

---

## 1. Environment Variables Setup

### 🔐 **Server Environment (.env)**

Create `server/.env` from `.env.example`:

```bash
# ========================================
# DATABASE CONFIGURATION
# ========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_consultancy
DB_USER=consultancy_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# ========================================
# SECURITY & AUTHENTICATION
# ========================================
# Generate strong secrets:
# openssl rand -base64 64
JWT_SECRET=your_jwt_secret_min_64_characters_long
SESSION_SECRET=your_session_secret_min_64_characters_long
JWT_EXPIRES_IN=7d

# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com

# ========================================
# GOOGLE OAUTH 2.0
# ========================================
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback

# ========================================
# GOOGLE GEMINI AI
# ========================================
# Get FREE key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp

# ========================================
# WEBRTC CONFIGURATION
# ========================================
# STUN Servers (Google's free servers)
STUN_SERVER_URL=stun:stun.l.google.com:19302
STUN_SERVER_URL_2=stun:stun1.l.google.com:19302

# TURN Server (Required for production)
# Get free TURN server from:
# - https://www.metered.ca/tools/openrelay/
# - https://www.twilio.com/stun-turn
TURN_SERVER_URL=turn:openrelay.metered.ca:80
TURN_USERNAME=openrelay
TURN_PASSWORD=openrelay

# ========================================
# FILE UPLOAD
# ========================================
MAX_FILE_SIZE=10
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# ========================================
# CORS & SECURITY
# ========================================
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 🎨 **Client Environment (.env)**

Create `client/.env` from `.env.example`:

```bash
# API Configuration
VITE_API_URL=https://your-api-domain.com
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_SOCKET_URL=https://your-api-domain.com

# WebRTC Configuration
VITE_STUN_SERVER_1=stun:stun.l.google.com:19302
VITE_STUN_SERVER_2=stun:stun1.l.google.com:19302

# Application Settings
VITE_APP_NAME=E-Consultancy
VITE_DEFAULT_LANGUAGE=en
VITE_ENABLE_VIDEO_CALLS=true
VITE_MAX_FILE_SIZE=10

# Google OAuth (must match server)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 2. Security Configuration

### 🔒 **Generate Strong Secrets**

```bash
# Generate JWT secret (64 characters)
openssl rand -base64 64

# Generate Session secret (64 characters)
openssl rand -base64 64

# Alternative: Use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 🛡️ **Security Checklist**

- [ ] **Change ALL default passwords** in `.env`
- [ ] **Use HTTPS** in production (SSL certificates)
- [ ] **Enable CORS** only for your frontend domain
- [ ] **Set secure cookies** (`secure: true` in production)
- [ ] **Use strong JWT secrets** (minimum 64 characters)
- [ ] **Enable rate limiting** to prevent API abuse
- [ ] **Validate all user inputs** on server
- [ ] **Sanitize file uploads** (check MIME types)
- [ ] **Use environment variables** for ALL secrets
- [ ] **Never commit `.env`** to version control

### 📝 **Update .gitignore**

Ensure these are in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Uploads folder (sensitive data)
server/uploads/*
!server/uploads/.gitkeep

# Logs
*.log
logs/

# Dependencies
node_modules/

# Build outputs
dist/
build/
```

---

## 3. WebRTC & Video Conferencing

### 🎥 **STUN/TURN Server Setup**

#### **Option 1: Free Public STUN Servers**

```javascript
// Already configured in .env
STUN_SERVER_URL=stun:stun.l.google.com:19302
STUN_SERVER_URL_2=stun:stun1.l.google.com:19302
```

**Limitations:**

- Works for ~80% of users
- May fail behind strict corporate firewalls
- No support for symmetric NAT

#### **Option 2: Free TURN Server (Metered)**

1. Visit: https://www.metered.ca/tools/openrelay/
2. Use these credentials:

```bash
TURN_SERVER_URL=turn:openrelay.metered.ca:80
TURN_USERNAME=openrelay
TURN_PASSWORD=openrelay
```

**Limitations:**

- Shared with other users
- No SLA guarantee
- Limited bandwidth

#### **Option 3: Twilio TURN (Recommended for Production)**

1. Sign up: https://www.twilio.com/
2. Get TURN credentials from Twilio Console
3. Update `.env`:

```bash
TURN_SERVER_URL=turn:global.turn.twilio.com:3478
TURN_USERNAME=your_twilio_username
TURN_PASSWORD=your_twilio_password
```

**Benefits:**

- 99.99% uptime
- Global infrastructure
- Better NAT traversal
- Free tier: 10,000 minutes/month

#### **Option 4: Self-Hosted TURN Server (coturn)**

Install coturn on your server:

```bash
# Ubuntu/Debian
sudo apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=yourdomain.com
```

### 🔌 **WebSocket Configuration**

Server is already configured with Socket.IO. Ensure these ports are open:

- **HTTP/HTTPS**: 80/443 (API + WebSocket)
- **WebRTC**: UDP ports 10000-20000 (if using TURN)

---

## 4. Database Setup

### 🗄️ **PostgreSQL Production Setup**

#### **Local Installation**

```bash
# Install PostgreSQL
# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql postgresql-contrib

# Create database and user
psql -U postgres

CREATE DATABASE e_consultancy;
CREATE USER consultancy_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE e_consultancy TO consultancy_user;
```

#### **Run Migrations**

```bash
cd server
node src/config/database.js
```

This will create all necessary tables.

#### **Production Database Options**

**Option 1: AWS RDS PostgreSQL**

- Managed service
- Automatic backups
- Scalable
- Free tier: 20GB storage

**Option 2: Heroku Postgres**

- Easy setup
- Free tier: 10,000 rows
- Automatic backups

**Option 3: DigitalOcean Managed Database**

- $15/month starter
- Automatic backups
- Easy scaling

**Update `.env` with production database URL:**

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 5. Docker Deployment

### 🐳 **Docker Configuration**

#### **Update `docker-compose.yml`**

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: econsultancy-db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Backend Server
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: econsultancy-server
    env_file:
      - ./server/.env
    ports:
      - "5000:5000"
    volumes:
      - ./server/uploads:/app/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  # Frontend Client
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL}
        - VITE_SOCKET_URL=${VITE_SOCKET_URL}
    container_name: econsultancy-client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  postgres_data:
```

#### **Server Dockerfile**

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/index.js"]
```

#### **Client Dockerfile**

Create `client/Dockerfile`:

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### **Nginx Configuration**

Create `client/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### **Deploy with Docker Compose**

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (CAREFUL - deletes data)
docker-compose down -v
```

---

## 6. Production Build

### 🏗️ **Manual Build (Without Docker)**

#### **Server Build**

```bash
cd server

# Install production dependencies only
npm ci --only=production

# Start with PM2 (process manager)
npm install -g pm2
pm2 start src/index.js --name econsultancy-server

# Save PM2 configuration
pm2 save
pm2 startup
```

#### **Client Build**

```bash
cd client

# Install dependencies
npm ci

# Build for production
npm run build

# The 'dist' folder contains the production build
# Deploy this folder to your web server (Nginx, Apache, etc.)
```

### 📦 **Serve Client Build**

**Option 1: Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Option 2: Serve with Node.js**

```bash
npm install -g serve
serve -s dist -l 3000
```

---

## 7. Deployment Platforms

### ☁️ **Option 1: Heroku**

#### **Server Deployment**

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create econsultancy-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set GEMINI_API_KEY=your_key
heroku config:set CLIENT_URL=https://your-frontend.com

# Deploy
cd server
git init
heroku git:remote -a econsultancy-api
git add .
git commit -m "Initial deployment"
git push heroku main
```

#### **Client Deployment**

```bash
# Deploy to Vercel (recommended for Vite/React)
npm install -g vercel
cd client
vercel --prod

# Or deploy to Netlify
npm install -g netlify-cli
cd client
netlify deploy --prod --dir=dist
```

### ☁️ **Option 2: AWS (EC2 + RDS)**

1. **Launch EC2 instance** (Ubuntu 22.04)
2. **Install dependencies:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt-get install postgresql-client

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install nginx
```

3. **Deploy application:**

```bash
# Clone repository
git clone your-repo-url
cd E-Consultancy

# Setup server
cd server
npm install
pm2 start src/index.js --name econsultancy

# Build client
cd ../client
npm install
npm run build

# Copy client build to Nginx
sudo cp -r dist/* /var/www/html/
```

4. **Configure Nginx:**

```bash
sudo nano /etc/nginx/sites-available/econsultancy
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Client (React app)
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/econsultancy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt:**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### ☁️ **Option 3: DigitalOcean App Platform**

1. Connect GitHub repository
2. Configure build settings:
   - **Server**: Dockerfile
   - **Client**: `npm run build`
3. Add environment variables in dashboard
4. Deploy automatically on git push

### ☁️ **Option 4: Render**

1. Create account at https://render.com
2. **Deploy Server:**

   - New Web Service
   - Connect GitHub repo
   - Build Command: `cd server && npm install`
   - Start Command: `node src/index.js`
   - Add environment variables

3. **Deploy Client:**
   - New Static Site
   - Build Command: `cd client && npm run build`
   - Publish Directory: `client/dist`

---

## 8. Post-Deployment

### ✅ **Deployment Checklist**

- [ ] **Test all API endpoints**
- [ ] **Test Google OAuth login**
- [ ] **Test video calling** (WebRTC)
- [ ] **Test file uploads**
- [ ] **Test voice consultation**
- [ ] **Test multilingual support** (all 8 languages)
- [ ] **Check database connections**
- [ ] **Verify SSL certificates**
- [ ] **Test on mobile devices**
- [ ] **Monitor server logs**
- [ ] **Setup error tracking** (Sentry)
- [ ] **Setup uptime monitoring**
- [ ] **Configure backups**
- [ ] **Document API endpoints**

### 📊 **Monitoring & Logging**

#### **PM2 Monitoring**

```bash
# View logs
pm2 logs econsultancy

# Monitor processes
pm2 monit

# Restart on errors
pm2 restart econsultancy
```

#### **Setup Sentry (Error Tracking)**

```bash
npm install @sentry/node @sentry/react
```

Add to `server/src/index.js`:

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 🔄 **Backup Strategy**

**Database Backups:**

```bash
# Automated daily backups
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * pg_dump e_consultancy > /backups/db_$(date +\%Y\%m\%d).sql
```

**File Uploads Backup:**

```bash
# Sync uploads to S3 or cloud storage
aws s3 sync ./server/uploads s3://your-bucket/uploads
```

### 🚀 **Performance Optimization**

1. **Enable Gzip compression** (Nginx)
2. **Use CDN** for static assets (Cloudflare)
3. **Implement caching** (Redis)
4. **Optimize images** before upload
5. **Use database indexing**
6. **Monitor memory usage**
7. **Load test** with tools like Apache JMeter

---

## 🎉 Deployment Complete!

Your E-Consultancy platform is now production-ready with:

✅ Secure environment variable management
✅ WebRTC video conferencing
✅ Real-time WebSocket communication
✅ PostgreSQL database
✅ Docker containerization
✅ SSL/HTTPS security
✅ Monitoring & logging
✅ Automated backups

### 📞 Support

If you encounter issues:

1. Check server logs: `pm2 logs` or `docker-compose logs`
2. Verify environment variables
3. Test database connection
4. Check firewall/port settings
5. Review Nginx configuration

---

**Last Updated:** October 6, 2025
