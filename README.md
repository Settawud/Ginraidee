# 🍜 Ginraidee - วันนี้กินอะไรดี?

> ระบบแนะนำอาหารอัจฉริยะ พร้อม Random Picker แบบ Slot Machine, Admin Dashboard และ Cloud Database

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Express.js](https://img.shields.io/badge/Express.js-4-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud-336791?logo=postgresql)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

## ✨ Features

### 🎰 Random Food Picker
- Slot machine animation สุ่มเมนูอาหาร
- Confetti celebration เมื่อได้ผลลัพธ์
- กรองตามหมวดหมู่และช่วงราคา

### 🍽️ เมนูอาหาร
- 16 เมนูอาหารหลากหลาย (ไทย, ญี่ปุ่น, เกาหลี, ตะวันตก, ฟาสต์ฟู้ด, ของหวาน)
- รูปภาพ AI-generated สวยงาม
- ค้นหาและกรองเมนู

### 📊 Admin Dashboard
- สถิติผู้ใช้และการสุ่ม
- Top 10 เมนูยอดนิยม
- กราฟแสดงข้อมูลรายวัน
- จัดการเมนู (CRUD)

### 🎨 UI/UX
- Dark mode design
- Glassmorphism effects
- Smooth animations (Framer Motion)
- Responsive design

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - Modern UI framework & bundler
- **Framer Motion** - Smooth animations
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Canvas Confetti** - Celebration effects
- **Context API** - State management

### Backend
- **Express.js 4** - REST API server
- **PostgreSQL** (via Supabase) - Cloud database
- **Supabase Auth SDK** - Authentication & database client
- **Passport.js** - Authentication middleware
- **Google OAuth 2.0** - Social authentication strategy
- **better-sqlite3 / Node-pg** - Database drivers
- **bcryptjs** - Password hashing
- **express-session** - Session management
## 🚀 Live Demo

🌐 **Web Application**
[https://ginraidee.onrender.com](https://ginraidee.onrender.com)

⚙️ **Backend API**
[https://ginraidee-api.onrender.com](https://ginraidee-api.onrender.com)

⏳ **Note:** Backend server is hosted on a free tier.
Please allow **up to 5 minutes** for the server to wake up on the first visit.

## 📁 Project Structure

```
ginraidee/
├── client/                          # Frontend (React + Vite)
│   ├── public/
│   │   ├── images/                  # AI-generated food images
│   │   └── _redirects               # Netlify routing config
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryFilter.jsx   # Filter by food category
│   │   │   ├── FoodCard.jsx         # Food display card
│   │   │   ├── Header.jsx           # Navigation header
│   │   │   ├── MenuManagement.jsx   # Admin menu editor
│   │   │   ├── PriceFilter.jsx      # Filter by price range
│   │   │   ├── ProtectedRoute.jsx   # Auth-protected routes
│   │   │   └── RandomPicker.jsx     # Slot machine picker
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Login.jsx            # Admin login page
│   │   │   ├── LoginCallback.jsx    # Google OAuth callback
│   │   │   ├── Menu.jsx             # Full menu page
│   │   │   ├── Admin.jsx            # Admin dashboard
│   │   │   └── Recommend.jsx        # Recommendation page
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx      # Authentication state
│   │   ├── hooks/
│   │   │   └── useFood.js           # Food data hook
│   │   ├── data/
│   │   │   └── staticMenu.json      # Static menu data
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css & App.css      # Styling
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
└── server/                          # Backend (Express.js)
    ├── config/
    │   ├── db.js                    # PostgreSQL connection pool
    │   ├── supabase.js              # Supabase client setup
    │   └── supabase-schema.sql      # Database schema
    ├── routes/
    │   ├── foods.js & foods-pg.js   # Food menu endpoints
    │   ├── auth.js & auth-pg.js     # Authentication endpoints
    │   ├── users.js & users-pg.js   # User tracking endpoints
    │   └── admin.js & admin-pg.js   # Admin management endpoints
    ├── scripts/                     # Utility scripts for image generation
    │   ├── generate_ai_images.js
    │   ├── download_images.js
    │   ├── analyze_images.js
    │   └── ... (other utilities)
    ├── data/
    │   └── foods.json               # Food menu data
    ├── app.js                       # Main Express server
    ├── .env                         # Environment variables (not in git)
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ginraidee.git
cd ginraidee
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Setup Backend Environment**
```bash
# Create .env file
cd server
touch .env

# Add required environment variables:
# DATABASE_URL=postgresql://user:password@host:port/dbname (Supabase)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
# FRONTEND_URL=http://localhost:5173
# PORT=3001
# NODE_ENV=development
# SESSION_SECRET=generate-a-random-secret
```

4. **Install Frontend Dependencies**
```bash
cd ../client
npm install
```

5. **Setup Frontend Environment (optional)**
```bash
# Copy example env file
cp .env.example .env
# Edit if needed (default localhost works for development)
```

### Running the Application

1. **Start Backend Server**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

2. **Start Frontend (new terminal)**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

3. **Open in browser**
- Main App: http://localhost:5173
- Admin Dashboard: http://localhost:5173/admin
- API Docs: http://localhost:3001

### Authentication
- **Google OAuth**: Sign in with Google account
- **Admin Login**: Configured via Supabase auth

## 🚀 Deployment

### Environment Setup
ก่อน deploy ต้องตั้งค่า environment variables ในแต่ละ platform:

**Required Environment Variables:**
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `GOOGLE_CLIENT_ID` - Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - OAuth redirect URI
- `FRONTEND_URL` - Frontend application URL
- `SESSION_SECRET` - Random session secret
- `NODE_ENV` - production / development

### Deployment on Render

#### Frontend (Static Site)
1. Create new Static Site on Render
2. Connect GitHub repository
3. Set Root Directory: `client`
4. Build Command: `npm run build`
5. Publish Directory: `dist`

#### Backend (Web Service)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add all environment variables above
7. Database: Uses Supabase PostgreSQL (no local database needed)

**Note:** Both frontend and backend are hosted on Render.
Backend is on free tier so may take 5 minutes to wake up after inactivity.

## ⚠️ Important Notes

> [!IMPORTANT]
> **Database**: โปรเจกต์นี้ใช้ **Supabase PostgreSQL** (Cloud Database) ไม่ใช่ SQLite
> - ข้อมูลจะถูกเก็บบน cloud และยังคงอยู่เมื่อ server restart
> - ต้องมี `DATABASE_URL` และ Supabase credentials ในไฟล์ `.env`
> - ข้อมูลจะ persist ระหว่าง deployments ต่าง ๆ

> [!WARNING]
> **Environment Variables**: ต้องสร้างไฟล์ `.env` ในโฟลเดอร์ `server` เสมอ
> - **ห้าม** commit `.env` ขึ้น Git (มีข้อมูลความลับ)
> - `.env` ถูก ignore โดยอัตโนมัติตาม `.gitignore`
> - Local development ต้องสร้างไฟล์ `.env` ด้วยตัวเอง

> [!NOTE]
> **Authentication**: โปรเจกต์นี้ใช้ Google OAuth 2.0
> - ต้องสร้าง OAuth app บน Google Cloud Console
> - เพิ่ม redirect URI: `http://localhost:3001/api/auth/google/callback`
> - เก็บ `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` ในไฟล์ `.env`


## 📷 Screenshots

### หน้าแรก (Landing Page)
- Hero section ที่สวยงามพร้อม floating animations
- ปุ่ม CTA ไปหน้าสุ่มเมนู

### หน้าสุ่มเมนู (Random Picker)
- Slot machine style picker
- Filter ตามหมวดหมู่และราคา
- Confetti celebration

### หน้าเมนู (Menu)
- รายการอาหารทั้งหมด
- ค้นหาและ sort

### Admin Dashboard
- สถิติผู้ใช้
- เมนูยอดนิยม
- กราฟข้อมูล

## 🔌 API Endpoints

### Foods
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/foods` | รายการอาหารทั้งหมด |
| GET | `/api/foods/:id` | รายละเอียดอาหาร |
| GET | `/api/foods/action/random` | สุ่มอาหาร |
| GET | `/api/foods/meta/categories` | หมวดหมู่ทั้งหมด |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/init` | Initialize user session |
| POST | `/api/users/select` | บันทึกการเลือกอาหาร |

### Authentication Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback handler |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user info |

### Admin Routes (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin authentication |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/popular-menus` | Top 10 popular menus |
| GET | `/api/admin/food-timeline` | Daily food selection timeline |
| POST | `/api/admin/foods` | Create new food item |
| PUT | `/api/admin/foods/:id` | Update food item |
| DELETE | `/api/admin/foods/:id` | Delete food item |

## 📝 License

MIT License - feel free to use for learning and projects!

## 🛡️ Security & Best Practices

- ✅ Environment variables for sensitive data (API keys, database URLs)
- ✅ Password hashing with bcryptjs
- ✅ Session-based authentication with express-session
- ✅ Google OAuth 2.0 for secure social login
- ✅ Protected routes for admin features
- ✅ CORS configured for cross-origin requests
- ✅ Database connection pooling for performance

## 📚 Database Schema

Database ใช้ PostgreSQL บน Supabase มี tables ดังนี้:
- **foods** - เมนูอาหาร
- **users** - ข้อมูลผู้ใช้งาน
- **user_selections** - ประวัติการเลือกอาหาร
- **admin_logs** - Admin activity logs

## 🐛 Troubleshooting

### Database Connection Error
```
❌ PostgreSQL connection failed
```
**Solution:**
- ตรวจสอบ `DATABASE_URL` ในไฟล์ `.env`
- ตรวจสอบว่า Supabase project สามารถเข้าถึงได้
- ตรวจสอบ firewall/network settings

### Google OAuth Issues
```
Error: Invalid OAuth redirect URI
```
**Solution:**
- ตรวจสอบ `GOOGLE_CALLBACK_URL` ตรงกันกับ Google Cloud Console
- ตรวจสอบ `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET`

### Port Already in Use
```
Error: listen EADDRINUSE :::3001
```
**Solution:**
```bash
# Kill process using port 3001
lsof -i :3001
kill -9 <PID>
```

## �👨‍💻 Author

Created with ❤️ as a learning project

---

⭐ **Star this repo** if you find it useful!
