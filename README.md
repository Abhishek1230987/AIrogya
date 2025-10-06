# E-Consultancy Platform

A full-stack medical consultation platform with PostgreSQL database, Google OAuth authentication, and Google Gemini AI integration.

## ✨ Features

- 🔐 **Secure Authentication** - Google OAuth & JWT
- 📄 **Medical Document Analysis** - AI-powered OCR and data extraction
- 🎤 **Voice Consultation** - Real-time voice recording and AI medical advice
- 🏥 **Medical History** - Comprehensive patient records
- 🤖 **AI Integration** - Google Gemini AI for smart medical insights (FREE tier available!)

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Google OAuth credentials
- **Google Gemini API Key** (FREE! - See [GEMINI_SETUP.md](./GEMINI_SETUP.md))

### Server Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
copy .env.example .env
```

4. Update the `.env` file with your actual values:

   - PostgreSQL database credentials
   - Google OAuth client ID and secret
   - JWT secrets

5. Start the server:

```bash
npm run dev
```

### Client Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

### Database Setup

The application will automatically create the necessary PostgreSQL tables on first run:

- `users` - User accounts and profiles
- `medical_history` - Patient medical records
- `sessions` - User session data

## Features

- ✅ PostgreSQL database with proper schemas
- ✅ Google OAuth 2.0 authentication
- ✅ JWT token-based authorization
- ✅ Responsive React frontend with Tailwind CSS
- ✅ Video consultation capabilities
- ✅ Medical history management
- ✅ Session persistence

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user (requires auth)

### Consultations

- `GET /api/consultations` - Get user consultations
- `POST /api/consultations` - Create new consultation

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router

### Backend

- Node.js
- Express.js
- PostgreSQL
- Passport.js
- JWT
- bcryptjs

### Authentication

- Google OAuth 2.0
- JWT tokens
- Secure session management
