# ScrMail 📧

A modern Gmail search platform built with the MERN stack. Sign in with Google and instantly search your inbox by keyword.

![ScrMail Landing Page](https://img.shields.io/badge/MERN-Stack-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🔐 **Google OAuth 2.0** — Secure sign-in with your Google account
- 🔍 **Keyword Email Search** — Search through your entire Gmail inbox instantly
- 📧 **Full Email View** — Preview snippets and read complete emails
- 📜 **Search History** — Saves past searches for quick re-use
- 🎨 **Modern Dark UI** — Glassmorphism design with smooth animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | Google OAuth 2.0 (Passport.js) |
| Email | Gmail API |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project with OAuth credentials

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/AbhinavJ911/ScrMail.git
cd ScrMail
```

2. **Backend setup**
```bash
cd backend
npm install
```

3. **Create `backend/.env`**
```env
MONGO_URI=your_mongodb_atlas_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=any_random_secret_string
CLIENT_URL=http://localhost:5173
```

4. **Frontend setup**
```bash
cd ../frontend
npm install
```

5. **Run the app**
```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable **Gmail API**
3. Configure **OAuth consent screen** (External, add Gmail readonly scope)
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy Client ID & Secret to your `.env` file

## License

MIT
