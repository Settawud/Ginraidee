-- Supabase SQL Schema for Ginraidee
-- Run this in Supabase SQL Editor (Table Editor -> SQL Editor)
-- Users table (for email/password registration)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    google_id TEXT UNIQUE,
    picture TEXT,
    role TEXT DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ DEFAULT NOW()
);
-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Foods table (menus)
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    price INTEGER DEFAULT 0,
    category TEXT,
    category_name TEXT,
    image TEXT,
    tags TEXT [] DEFAULT '{}',
    rating DECIMAL(2, 1) DEFAULT 4.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- User selections (food picks history)
CREATE TABLE IF NOT EXISTS user_selections (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
    selected_at TIMESTAMPTZ DEFAULT NOW()
);
-- Page views
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    page TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);
-- Insert default admin (password: admin123)
INSERT INTO admins (username, password_hash)
VALUES (
        'admin',
        '$2a$10$8VKYfMXf9y4mN7XhZH7vT.hUzV.eFPZfZJT/wX3P4MsK7Lf.Dq/yG'
    ) ON CONFLICT (username) DO NOTHING;
-- Insert sample foods
INSERT INTO foods (
        name,
        name_en,
        description,
        price,
        category,
        category_name,
        image,
        tags,
        rating
    )
VALUES (
        'ผัดกะเพราหมูสับ',
        'Stir-fried Basil Pork',
        'หมูสับผัดกับกะเพรา พริก กระเทียม หอมหัวใหญ่ รสจัดจ้าน เสิร์ฟพร้อมไข่ดาว',
        50,
        'thai',
        'อาหารไทย',
        '/images/kaprao.jpg',
        ARRAY ['spicy', 'rice', 'popular'],
        4.8
    ),
    (
        'ข้าวมันไก่',
        'Hainanese Chicken Rice',
        'ไก่ต้มเนื้อนุ่ม เสิร์ฟพร้อมข้าวมันหอม น้ำจิ้มสูตรพิเศษ และน้ำซุปใส',
        45,
        'thai',
        'อาหารไทย',
        '/images/khao_man_kai.jpg',
        ARRAY ['chicken', 'rice', 'popular'],
        4.7
    ),
    (
        'ต้มยำกุ้ง',
        'Tom Yum Goong',
        'ต้มยำกุ้งน้ำข้น รสเปรี้ยวเผ็ด หอมสมุนไพรไทย',
        120,
        'thai',
        'อาหารไทย',
        '/images/tom_yum.jpg',
        ARRAY ['spicy', 'soup', 'seafood'],
        4.9
    ),
    (
        'ส้มตำไทย',
        'Thai Papaya Salad',
        'ส้มตำสูตรดั้งเดิม มะละกอ มะเขือเทศ ถั่วฝักยาว กุ้งแห้ง',
        40,
        'thai',
        'อาหารไทย',
        '/images/somtam.jpg',
        ARRAY ['spicy', 'salad', 'popular'],
        4.6
    ),
    (
        'ราเมนทงคตสึ',
        'Tonkotsu Ramen',
        'ราเมนน้ำซุปกระดูกหมูเข้มข้น ชาชูนุ่ม ไข่ยางมะตูม',
        159,
        'japanese',
        'อาหารญี่ปุ่น',
        '/images/ramen.jpg',
        ARRAY ['noodle', 'soup', 'pork'],
        4.8
    ),
    (
        'ซูชิรวม',
        'Sushi Platter',
        'เซ็ตซูชิรวม 8 ชิ้น ปลาแซลมอน ทูน่า กุ้ง หอยเชลล์',
        289,
        'japanese',
        'อาหารญี่ปุ่น',
        '/images/sushi.jpg',
        ARRAY ['seafood', 'rice', 'premium'],
        4.7
    ),
    (
        'บิบิมบับ',
        'Bibimbap',
        'ข้าวยำเกาหลี ผักสด น้ำจิ้มโคชูจัง ไข่ดาว เนื้อหมัก',
        139,
        'korean',
        'อาหารเกาหลี',
        '/images/bibimbap.jpg',
        ARRAY ['rice', 'vegetables', 'healthy'],
        4.5
    ),
    (
        'พิซซ่ามาร์เกอริต้า',
        'Margherita Pizza',
        'พิซซ่าสไตล์อิตาเลียนแท้ มะเขือเทศ มอสซาเรลล่า โหระพา',
        199,
        'western',
        'อาหารตะวันตก',
        '/images/pizza.jpg',
        ARRAY ['cheese', 'italian', 'sharing'],
        4.4
    ),
    (
        'เบอร์เกอร์เนื้อ',
        'Beef Burger',
        'เบอร์เกอร์เนื้อวัวนุ่มฉ่ำ ชีส ผักสด ซอสพิเศษ เฟรนช์ฟรายส์',
        149,
        'fastfood',
        'ฟาสต์ฟู้ด',
        '/images/burger.jpg',
        ARRAY ['beef', 'cheese', 'popular'],
        4.4
    ),
    (
        'บิงซูสตรอว์เบอร์รี่',
        'Strawberry Bingsu',
        'น้ำแข็งไสเนียนนุ่ม ท็อปสตรอว์เบอร์รี่สด นมข้นหวาน',
        159,
        'dessert',
        'ของหวาน',
        '/images/bingsu.jpg',
        ARRAY ['cold', 'fruit', 'sharing'],
        4.6
    ) ON CONFLICT DO NOTHING;
-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
-- Create policies for public read access to foods
CREATE POLICY "Foods are viewable by everyone" ON foods FOR
SELECT USING (true);
-- Create policies for authenticated users
CREATE POLICY "Users can read own data" ON users FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR
UPDATE USING (auth.uid() = id);