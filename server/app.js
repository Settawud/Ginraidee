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

// Trust Proxy for Render/Heroku (Must be before session for secure cookies)
app.set('trust proxy', 1);

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

// Debug Session
app.use((req, res, next) => {
  console.log(`[Session Check] ${req.method} ${req.url}`);
  console.log(`> Env: ${process.env.NODE_ENV}, Secure: ${req.secure}, Session: ${!!req.session}`);
  next();
});

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

// Middleware
// (Duplicates removed)

// Load food data (static)
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
    CREATE TABLE IF NOT EXISTS food_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      food_id INTEGER,
      action TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
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
            CREATE TABLE IF NOT EXISTS food_feedback (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                food_id INTEGER,
                action TEXT CHECK (action IN ('like', 'dislike')),
                created_at TIMESTAMPTZ DEFAULT NOW()
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

// Health check with beautiful UI
app.get('/api', (req, res) => {
  const mode = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ginraidee API</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          max-width: 450px;
          width: 90%;
        }
        .emoji { font-size: 4rem; margin-bottom: 1rem; }
        h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #f97316, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          margin-bottom: 2rem;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.4);
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          margin-bottom: 2rem;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .status-text { color: #22c55e; font-weight: 600; }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .info-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .info-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .info-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🍜</div>
        <h1>Ginraidee API</h1>
        <p class="subtitle">Food Recommendation Service</p>
        
        <div class="status-badge">
          <div class="status-dot"></div>
          <span class="status-text">Server is Running</span>
        </div>
        
        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Database</div>
            <div class="info-value">${mode}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Uptime</div>
            <div class="info-value">${hours}h ${minutes}m ${seconds}s</div>
          </div>
        </div>
        
        <p class="footer">Ready to serve delicious recommendations ✨</p>
      </div>
    </body>
    </html>
  `);
});

// Serve static files from React app (production) - only if client/dist exists
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  const fs = require('fs');

  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    // Handle React routing (Express 5 compatible wildcard)
    app.get('/{*path}', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    console.log('📝 Note: client/dist not found - running as API-only server');
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🍜 Ginraidee Server running on http://localhost:${PORT}`);
});

module.exports = app;
