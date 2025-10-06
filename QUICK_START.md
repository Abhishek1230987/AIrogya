# 🚀 E-Consultancy - Quick Deployment Reference

## ⚡ **5-Minute Setup**

### Step 1: Environment Variables

```bash
# Server
cd server
cp .env.example .env
nano .env  # Fill in YOUR values

# Client
cd ../client
cp .env.example .env
nano .env  # Fill in YOUR values
```

### Step 2: Essential Secrets (MUST CHANGE!)

```bash
# Generate strong secrets:
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for SESSION_SECRET
```

### Step 3: Get API Keys (FREE!)

1. **Gemini AI** → https://makersuite.google.com/app/apikey
2. **Google OAuth** → https://console.cloud.google.com/apis/credentials

### Step 4: Start Application

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start servers
cd server && npm run dev  # Terminal 1
cd client && npm run dev   # Terminal 2
```

**Done!** → http://localhost:5173

---

## 📋 **Critical Environment Variables**

### **MUST CONFIGURE:**

```bash
# Server .env
DB_PASSWORD=your_strong_password_here
JWT_SECRET=min_64_characters_random
SESSION_SECRET=min_64_characters_random
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```

```bash
# Client .env
VITE_API_URL=http://localhost:5000  # Dev
VITE_SOCKET_URL=http://localhost:5000  # Dev
VITE_GOOGLE_CLIENT_ID=same_as_server_google_id
```

---

## 🐳 **Docker Deployment (1 Command)**

```bash
# 1. Configure .env files (server & client)
# 2. Run:
docker-compose up -d --build
```

**Done!** → http://localhost

---

## ☁️ **Production Deployment**

### **Heroku (Recommended for Beginners)**

```bash
# Server
cd server
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your_secret
heroku config:set GEMINI_API_KEY=your_key
heroku config:set CLIENT_URL=https://your-frontend.com
git push heroku main

# Client (Deploy to Vercel)
cd client
npm install -g vercel
vercel --prod
```

### **AWS EC2**

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 🔧 **Common Issues & Quick Fixes**

### ❌ **"Cannot connect to database"**

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check credentials
psql -U consultancy_user -d e_consultancy
```

### ❌ **"CORS error"**

```bash
# Server .env
CLIENT_URL=http://localhost:5173  # Must match your frontend URL

# Client .env
VITE_API_URL=http://localhost:5000  # Must match your backend URL
```

### ❌ **"Video call not connecting"**

```bash
# Add TURN server to server .env
TURN_SERVER_URL=turn:openrelay.metered.ca:80
TURN_USERNAME=openrelay
TURN_PASSWORD=openrelay
```

### ❌ **"Environment variables not loading"**

```bash
# Ensure .env file exists
ls -la server/.env
ls -la client/.env

# Restart servers
# Kill terminals and restart
```

---

## 🎯 **Feature Testing Checklist**

```bash
✅ Register/Login works
✅ Google OAuth works
✅ Voice consultation works
✅ File upload works
✅ Video call works
✅ Language switching works (8 languages)
✅ Medical history works
✅ Dashboard loads
```

---

## 📞 **Get Help**

1. Check server logs: `cd server && npm run dev`
2. Check browser console (F12)
3. Read `DEPLOYMENT_GUIDE.md` for detailed info
4. Check `PRODUCTION_READY_SUMMARY.md` for full overview

---

## 🔐 **Security Checklist**

```bash
✅ Changed all default passwords
✅ Generated strong JWT_SECRET (64+ characters)
✅ Generated strong SESSION_SECRET (64+ characters)
✅ Added real Gemini API key
✅ Configured Google OAuth (production URLs)
✅ .env file NOT committed to git
✅ HTTPS enabled (production)
✅ CORS restricted to your domain
```

---

## 📦 **What's Included**

- ✅ **8 Languages**: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada
- ✅ **Authentication**: JWT + Google OAuth
- ✅ **AI Features**: Gemini-powered medical analysis
- ✅ **Video Calls**: WebRTC with Socket.IO
- ✅ **Voice Consultation**: Speech recognition + AI
- ✅ **OCR**: Medical report scanning (Tesseract)
- ✅ **Security**: Encrypted passwords, JWT tokens
- ✅ **Database**: PostgreSQL with proper schema
- ✅ **Deployment**: Docker + multiple platform guides

---

## 🎓 **Learn More**

- **Full Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Complete Summary**: `PRODUCTION_READY_SUMMARY.md`
- **Project Description**: `PROJECT_DESCRIPTION_FOR_RESUME.md`
- **Language Implementation**: `LANGUAGE_SELECTOR_IMPLEMENTATION.md`

---

**Need more help?** Read the detailed `DEPLOYMENT_GUIDE.md`

**Last Updated:** October 6, 2025
