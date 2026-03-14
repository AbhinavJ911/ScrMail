require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const passport = require('./config/passport');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const historyRoutes = require('./routes/history');

const app = express();

// Trust proxy for Render/Heroku (required for secure cookies behind reverse proxy)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.set('trust proxy', 1);
}

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'scrmail-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ScrMail API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ScrMail server running on port ${PORT}`);
});
