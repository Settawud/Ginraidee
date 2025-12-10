# 🍜 Ginraidee - วันนี้กินอะไรดี?

> ระบบแนะนำอาหารอัจฉริยะ พร้อม Random Picker แบบ Slot Machine และ Admin Dashboard

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Express.js](https://img.shields.io/badge/Express.js-5-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
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
- **React 18** + **Vite**
- **Framer Motion** - Animations
- **React Router v6** - Navigation
- **Axios** - HTTP Client
- **Canvas Confetti** - Celebration effects

### Backend
- **Express.js 5**
- **SQLite** (better-sqlite3)
- **bcryptjs** - Password hashing
- **express-session** - Session management

## 📁 Project Structure

```
ginraidee/
├── client/                 # Frontend (React + Vite)
│   ├── public/images/      # AI-generated food images
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── styles/         # CSS files
│   └── index.html
│
└── server/                 # Backend (Express.js)
    ├── data/
    │   ├── foods.json      # Food menu data
    │   └── database.sqlite # SQLite database
    ├── routes/             # API routes
    └── app.js              # Main server
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
# Copy example env file
cp .env.example .env
# Edit .env and set your SESSION_SECRET
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

### Admin Login
- **Username:** `admin`
- **Password:** `admin123`

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

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/popular-menus` | เมนูยอดนิยม |
| POST | `/api/admin/menus` | เพิ่มเมนูใหม่ |
| PUT | `/api/admin/menus/:id` | แก้ไขเมนู |
| DELETE | `/api/admin/menus/:id` | ลบเมนู |

## 📝 License

MIT License - feel free to use for learning and projects!

## 👨‍💻 Author

Created with ❤️ as a learning project

---

⭐ **Star this repo** if you find it useful!
