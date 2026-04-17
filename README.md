# ScrMail 📧🔒

A production-grade Gmail search platform built with the MERN stack, featuring **Redis caching**, **AES-256-GCM encryption**, **rate limiting**, and **professional backend architecture**.

![MERN Stack](https://img.shields.io/badge/MERN-Stack-green) ![Redis](https://img.shields.io/badge/Redis-Caching-red) ![AES-256](https://img.shields.io/badge/Encryption-AES--256--GCM-blue) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

### Core Features
- 🔐 **Google OAuth 2.0** — Secure sign-in with your Google account
- 🔍 **Keyword Email Search** — Search through your entire Gmail inbox instantly
- 📧 **Full Email View** — Preview snippets and read complete emails
- 📜 **Search History** — Saves past searches for quick re-use
- 🎨 **Modern Dark UI** — Glassmorphism design with smooth animations

### Advanced Features (v2.0)
- ⚡ **RediSearch Indexing** — Emails are indexed natively within Redis via FT.CREATE and FT.SEARCH, drastically improving cache retrieval efficiency
- 🔒 **AES-256-GCM Encryption** — OAuth tokens encrypted at rest in the database
- 🛡️ **Rate Limiting** — Redis-backed API rate limiting (100 req/min general, 30/min search)
- 📊 **Structured Logging** — Winston-based logging with dev/production formats
- ✅ **Input Validation** — Joi schema validation on all API inputs
- 🪖 **Security Headers** — Helmet.js for HTTP security headers
- 📡 **Health Monitoring** — Health check endpoint with service status (Redis, MongoDB)
- 🔄 **Graceful Shutdown** — Clean disconnection of Redis and MongoDB on server stop
- 🏗️ **Production Architecture** — Standardized error handling, API responses, and folder structure

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Search Index | RediSearch (Upstash / Redis Stack Server) |
| Auth | Google OAuth 2.0 (Passport.js) |
| Email | Gmail API |
| Encryption | AES-256-GCM (Node.js crypto) |
| Logging | Winston + Morgan |
| Validation | Joi |
| Security | Helmet, CORS, Rate Limiting |
| Deployment | Render (Backend) + Vercel (Frontend) |

---

## 📁 Project Structure

```
ScrMail/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection with event monitoring
│   │   ├── passport.js        # Google OAuth strategy with encrypted tokens
│   │   └── redis.js           # Redis client with TLS, fallback, and FT.CREATE RediSearch INIT logic
│   ├── middleware/
│   │   ├── auth.js            # Authentication guard middleware
│   │   ├── errorHandler.js    # Global error handler (dev/prod modes)
│   │   ├── rateLimiter.js     # Redis-backed rate limiting
│   │   └── validator.js       # Joi-based input validation
│   ├── models/
│   │   ├── User.js            # User model with encryption hooks
│   │   └── SearchHistory.js   # Search history model
│   ├── routes/
│   │   ├── auth.js            # OAuth routes with rate limiting
│   │   ├── email.js           # RediSearch integration via FT.SEARCH and HSET inserts
│   │   └── history.js         # Search history CRUD with caching
│   ├── utils/
│   │   ├── encryption.js      # AES-256-GCM encrypt/decrypt functions
│   │   ├── logger.js          # Winston structured logger
│   │   ├── ApiResponse.js     # Standardized success/error responses
│   │   └── ApiError.js        # Custom error class with HTTP codes
│   ├── .env.example           # Environment template
│   ├── package.json
│   └── server.js              # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth context provider
│   │   ├── pages/             # Landing + Dashboard pages
│   │   └── utils/             # Axios API client
│   ├── vercel.json            # Vercel SPA routing config
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB Atlas** account ([create free](https://www.mongodb.com/atlas))
- **Google Cloud Console** project with OAuth credentials
- **Redis** (optional for local dev — app falls back gracefully)

### 1. Clone the Repository

```bash
git clone https://github.com/AbhinavJ911/ScrMail.git
cd ScrMail
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/scrmail

# Google OAuth 2.0 credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session secret (any random string)
SESSION_SECRET=your_random_session_secret

# Frontend URL
CLIENT_URL=http://localhost:5173

# AES-256 Encryption Key (generate with: npm run generate-key)
ENCRYPTION_KEY=your_64_char_hex_key

# Redis URL (optional for local dev)
# REDIS_URL=rediss://default:password@endpoint.upstash.io:6379
```

> 💡 **Generate encryption key:** Run `npm run generate-key` in the backend directory.

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

### 5. Run the Application

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔴 Redis Setup

### Option A: Local Redis (Development)

**Windows:**
```bash
# Install via WSL or use Memurai (Windows Redis alternative)
# Or use Docker:
docker run -d --name redis -p 6379:6379 redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

> The app works without Redis — it falls back to MongoDB sessions and skips caching.

### Option B: Upstash Redis (Production — Recommended)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database (free tier)
3. Copy the **Redis URL** (starts with `rediss://`)
4. Add to your `.env`: `REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379`

---

## 🔒 Security Features

### AES-256-GCM Encryption
- OAuth access tokens and refresh tokens are **encrypted at rest** in MongoDB
- Uses Node.js built-in `crypto` module — no external dependencies
- Encrypted format: `iv:authTag:ciphertext` (all base64-encoded)
- **Migration-safe**: Handles both encrypted and plaintext tokens gracefully
- Encryption key is a 256-bit hex string stored in `ENCRYPTION_KEY` env var

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 1 minute |
| Email Search | 30 requests | 1 minute |
| Authentication | 10 requests | 1 minute |

Rate limits are tracked in Redis (production) or in-memory (development).

### Security Headers (Helmet.js)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- Content Security Policy
- And more...

### Other Security Measures
- HTTP-only, secure cookies for sessions
- CORS restricted to configured frontend origin
- Input validation on all API endpoints (Joi)
- Standardized error responses (no stack traces in production)

---

## 🌐 Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add environment variables:
   ```
   NODE_ENV=production
   MONGO_URI=<your-atlas-uri>
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   SESSION_SECRET=<strong-random-string>
   ENCRYPTION_KEY=<64-char-hex-key>
   REDIS_URL=<your-upstash-redis-url>
   CLIENT_URL=<your-vercel-frontend-url>
   ```
5. Add your Render URL to Google Cloud Console as an authorized redirect URI:
   `https://your-app.onrender.com/auth/google/callback`

### Frontend → Vercel

1. Import your GitHub repository on [Vercel](https://vercel.com)
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/` | Health check & service status | ❌ | General |
| GET | `/auth/google` | Initiate Google OAuth | ❌ | Auth (10/min) |
| GET | `/auth/google/callback` | OAuth callback | ❌ | Auth |
| GET | `/auth/current-user` | Get authenticated user | ✅ | General |
| GET | `/auth/logout` | Logout & destroy session | ✅ | General |
| GET | `/api/email/search?q=` | Search Gmail by keyword | ✅ | Search (30/min) |
| GET | `/api/history` | Get search history | ✅ | General |
| POST | `/api/history` | Save search keyword | ✅ | General |
| DELETE | `/api/history/:id` | Delete history entry | ✅ | General |

### Response Format

All API responses follow a standardized format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Emails retrieved from cache",
  "data": { ... },
  "cached": true,
  "timestamp": "2026-04-17T10:00:00.000Z"
}
```

---

## 🔧 Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable **Gmail API**
3. Configure **OAuth consent screen** (External, add Gmail readonly scope)
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URIs:
   - Local: `http://localhost:5000/auth/google/callback`
   - Production: `https://your-backend.onrender.com/auth/google/callback`
6. Copy Client ID & Secret to your `.env` file

---

## 📄 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `SESSION_SECRET` | ✅ | Random string for session signing |
| `CLIENT_URL` | ✅ | Frontend URL (e.g., `http://localhost:5173`) |
| `ENCRYPTION_KEY` | ✅ | 64-char hex string for AES-256 encryption |
| `REDIS_URL` | ❌ | Redis connection URL (production) |
| `NODE_ENV` | ❌ | Set to `production` for deployment |
| `PORT` | ❌ | Server port (default: 5000) |

---

## 📝 License

MIT
