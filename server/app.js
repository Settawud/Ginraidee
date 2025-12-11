require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool, query } = require('./config/db');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database Tables
async function initDatabase() {
  try {
    await query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password_hash TEXT,
                name TEXT,
                role TEXT DEFAULT 'user',
                google_id TEXT UNIQUE,
                picture TEXT,
                preferences JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_visit TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS user_selections (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                food_id INTEGER,
                selected_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS page_views (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                page TEXT,
                viewed_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
    console.log('✅ Database tables initialized');

    // Create default admin
    const adminResult = await query('SELECT * FROM admins WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', hashedPassword]);
      console.log('Default admin created: admin / admin123');
    }
  } catch (error) {
    console.error('Database init error:', error.message);
  }
}
initDatabase();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ginraidee.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ginraidee-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Load auth routes first (to get findOrCreateUser)
const authRouter = require('./routes/auth-pg')(query);

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await authRouter.findOrCreateUser(profile);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  console.log('✅ Google OAuth configured');
} else {
  console.log('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, { id: user.id, type: user.google_id ? 'google' : 'user' });
});

passport.deserializeUser(async (serialized, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [serialized.id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, null);
    }
  } catch (error) {
    done(error, null);
  }
});

// Load food data
const foods = require('./data/foods.json');

// Routes
const foodsRouter = require('./routes/foods-pg')(query, foods);
const usersRouter = require('./routes/users-pg')(query);
const adminRouter = require('./routes/admin-pg')(query, foods);

app.use('/api/auth', authRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍜 Ginraidee Server running on http://localhost:${PORT}`);
});

module.exports = app;
