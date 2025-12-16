require('dotenv').config();
const express = require('express');
const path = require('path');
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

// =============================================
// Middleware Setup
// =============================================

// CORS - allow frontend to make requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'ginraidee-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Will be handled by authRouter.findOrCreateUser after router is loaded
      const user = await app.locals.findOrCreateUser(profile);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// =============================================
// Initialize Database & Routes based on Configuration
// =============================================

let authRouter, foodsRouter, usersRouter, adminRouter;

// Load food data (static)
const foods = require('./data/foods.json');

// Helper to initialize SQLite
function initSQLite() {
  console.log('📂 databases.sqlite fallback enabled (No DATABASE_URL)');
  const db = new Database(path.join(__dirname, 'data', 'database.sqlite'));

  // Create tables (SQLite)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT DEFAULT 'user',
      session_id TEXT,
      preferences TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_visit DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      food_id INTEGER,
      selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      page TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
     CREATE TABLE IF NOT EXISTS google_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      picture TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Default Admin
  const adminExists = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hashedPassword);
    console.log('Default admin created: admin / admin123');
  }

  // Routes (SQLite)
  authRouter = require('./routes/auth')(db);
  foodsRouter = require('./routes/foods')(db, foods);
  usersRouter = require('./routes/users')(db);
  adminRouter = require('./routes/admin')(db, foods);

  // Passport Serializer (SQLite)
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, type: user.google_id ? 'google' : 'admin' });
  });

  passport.deserializeUser((serialized, done) => {
    try {
      if (serialized.type === 'google') {
        const user = db.prepare('SELECT * FROM google_users WHERE id = ?').get(serialized.id);
        done(null, user);
      } else {
        const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(serialized.id);
        if (admin) {
          done(null, { ...admin, role: 'admin' });
        } else {
          // Try regular user table for password login
          const user = db.prepare('SELECT * FROM users WHERE id = ?').get(serialized.id);
          done(null, user || null);
        }
      }
    } catch (error) {
      done(error, null);
    }
  });
}

// Helper to initialize Postgres
async function initPostgres() {
  console.log('🐘 PostgreSQL enabled');
  const { query } = require('./config/db');

  // Create tables (Postgres)
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
    // Default Admin
    const adminResult = await query('SELECT * FROM admins WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', hashedPassword]);
      console.log('Default admin created: admin / admin123');
    }
  } catch (e) { console.error('PG Init Error:', e.message); }

  // Routes (Postgres)
  authRouter = require('./routes/auth-pg')(query);
  foodsRouter = require('./routes/foods-pg')(query, foods);
  usersRouter = require('./routes/users-pg')(query);
  adminRouter = require('./routes/admin-pg')(query, foods);

  // Passport Serializer (Postgres)
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, type: user.google_id ? 'google' : 'user' });
  });

  passport.deserializeUser(async (serialized, done) => {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [serialized.id]);
      if (result.rows.length > 0) done(null, result.rows[0]);
      else done(null, null);
    } catch (error) {
      done(error, null);
    }
  });

  return { authRouter, foodsRouter, usersRouter, adminRouter };
}

// Main Initialization Logic
if (process.env.DATABASE_URL) {
  // Use Postgres
  initPostgres().then(() => {
    mountRoutes();
  });
} else {
  // Use SQLite
  initSQLite();
  mountRoutes();
}

function mountRoutes() {
  // Set findOrCreateUser for Google OAuth strategy
  if (authRouter && authRouter.findOrCreateUser) {
    app.locals.findOrCreateUser = authRouter.findOrCreateUser;
  }

  app.use('/api/auth', authRouter);
  app.use('/api/foods', foodsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admin', adminRouter);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: process.env.DATABASE_URL ? 'postgres' : 'sqlite' });
});

// Serve static files from React app (production)
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Handle React routing (Express 5 compatible wildcard)
  app.get('/(.*)', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🍜 Ginraidee Server running on http://localhost:${PORT}`);
});

module.exports = app;
