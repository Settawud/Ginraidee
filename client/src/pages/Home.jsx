import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiHeart, FiTrendingUp } from 'react-icons/fi';
import './Home.css';

const Home = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        // Track page view
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        fetch(`${apiBase}/users/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 'home' }),
            credentials: 'include'
        }).catch(() => { });
    }, []);

    const features = [
        {
            icon: <FiZap />,
            title: 'สุ่มเมนูง่ายๆ',
            description: 'แค่กดปุ่มเดียว ระบบจะช่วยตัดสินใจให้คุณ'
        },
        {
            icon: <FiHeart />,
            title: 'จดจำความชอบ',
            description: 'ยิ่งใช้มาก ยิ่งแนะนำตรงใจ'
        },
        {
            icon: <FiTrendingUp />,
            title: 'เมนูยอดนิยม',
            description: 'ดูว่าคนอื่นชอบกินอะไร'
        }
    ];

    const foodEmojis = ['🍜', '🍣', '🍔', '🍕', '🥗', '🍛', '🍝', '🍰', '🥘', '🌮'];

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero" ref={heroRef}>
                <div className="hero-bg">
                    {foodEmojis.map((emoji, i) => (
                        <motion.span
                            key={i}
                            className="floating-emoji"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                y: [0, -20, 0],
                                x: [0, Math.random() * 20 - 10, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: i * 0.5
                            }}
                            style={{
                                left: `${10 + (i * 9)}%`,
                                top: `${20 + (i % 3) * 25}%`,
                                fontSize: `${2 + Math.random()}rem`
                            }}
                        >
                            {emoji}
                        </motion.span>
                    ))}
                </div>

                <div className="hero-content container">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <h1 className="hero-title">
                            <span className="title-line">วันนี้</span>
                            <span className="title-line text-gradient">กินอะไรดี?</span>
                        </h1>

                        <p className="hero-subtitle">
                            ไม่ต้องคิดเอง! ให้เราช่วยตัดสินใจ
                            <br />
                            สุ่มเมนูอร่อยใกล้ตัวคุณได้ทันที
                        </p>

                        <div className="hero-cta">
                            <Link to="/recommend">
                                <motion.button
                                    className="btn btn-primary btn-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🎲 สุ่มเลย!
                                    <FiArrowRight />
                                </motion.button>
                            </Link>
                            <Link to="/menu">
                                <motion.button
                                    className="btn btn-secondary"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ดูเมนูทั้งหมด
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="hero-card">
                            <div className="card-glow" />
                            <div className="card-content">
                                <span className="card-emoji">🍜</span>
                                <h3>ก๋วยเตี๋ยวเรือ</h3>
                                <p>อร่อยถูกปาก</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="hero-scroll-indicator">
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <span>เลื่อนลง</span>
                        <div className="scroll-line" />
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features section">
                <div className="container">
                    <motion.h2
                        className="section-title"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        ทำไมต้อง <span className="text-gradient">Ginraidee</span>?
                    </motion.h2>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="feature-card glass-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                            >
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats section">
                <div className="container">
                    <div className="stats-grid">
                        <motion.div
                            className="stat-item"
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <span className="stat-number">24+</span>
                            <span className="stat-label">เมนูอร่อย</span>
                        </motion.div>
                        <motion.div
                            className="stat-item"
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <span className="stat-number">6</span>
                            <span className="stat-label">หมวดหมู่</span>
                        </motion.div>
                        <motion.div
                            className="stat-item"
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="stat-number">∞</span>
                            <span className="stat-label">ความอร่อย</span>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta section">
                <div className="container">
                    <motion.div
                        className="cta-card glass-card"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>พร้อมลุยหรือยัง?</h2>
                        <p>มาดูกันว่าวันนี้จะได้กินอะไร!</p>
                        <Link to="/recommend">
                            <motion.button
                                className="btn btn-primary btn-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                🎰 สุ่มเมนูเลย!
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;
