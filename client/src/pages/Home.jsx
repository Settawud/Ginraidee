import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiZap, FiHeart, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import './Home.css';

const placeholderImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

// Helper function to resolve image URL
const getImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage;
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    // If it's a relative path like /images/..., it's from public folder
    if (imagePath.startsWith('/')) {
        return imagePath; // Vite serves from public folder
    }
    return placeholderImage;
};

const Home = () => {
    const heroRef = useRef(null);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [foods, setFoods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Only use data from database - no fallback to example data
    const displayFoods = foods;

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

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0); // Real-time drag offset in pixels
    const hoverTimeout = useRef(null);

    const sliderRef = useRef(null);
    const scrollTimeout = useRef(null);

    // Scroll hijacking removed to restore native scrolling performance
    // The carousel can still be navigated via drag/swipe gestures handled by the container (not shown here but retained in state)

    const handleHover = (index) => {
        if (isDragging) return;
        if (index === currentSlide) return;

        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

        // Quick hover response (80ms)
        hoverTimeout.current = setTimeout(() => {
            setHoveredIndex(index);
        }, 80);
    };

    const handlePanEnd = () => {
        // Determine which slide to snap to based on drag distance
        const slideWidth = 220; // Approximate width between slides
        const slidesToMove = Math.round(-dragOffset / slideWidth);

        if (displayFoods.length > 0 && slidesToMove !== 0) {
            setCurrentSlide((prev) => {
                let next = prev + slidesToMove;
                // Wrap around
                next = ((next % displayFoods.length) + displayFoods.length) % displayFoods.length;
                return next;
            });
        }

        // Reset drag state
        setDragOffset(0);
        setTimeout(() => setIsDragging(false), 50);
    };

    useEffect(() => {
        // Track page view
        fetch(`${apiBase}/users/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 'home' }),
            credentials: 'include'
        }).catch(() => { });

        // Fetch foods from database
        const fetchFoods = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`${apiBase}/foods`);
                console.log("API Response:", res.data);

                // Handle various response shapes
                let data = [];
                if (Array.isArray(res.data)) {
                    data = res.data;
                } else if (res.data && Array.isArray(res.data.data)) {
                    data = res.data.data;
                }

                if (data.length > 0) {
                    // Filter out invalid items to prevent crashes
                    const validFoods = data.filter(item => item && (item.name || item.title));

                    // Preload images to prevent lag/freezing during carousel animation
                    const preloadImages = validFoods.map(food => {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = getImageUrl(food.image || food.img);
                            img.onload = resolve;
                            img.onerror = resolve; // Continue even if error
                        });
                    });

                    // Wait for images with a timeout (max 3 seconds to avoid blocking too long)
                    // If images are slow, we show what we have so far or just rely on progressive loading after timeout
                    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));

                    await Promise.race([
                        Promise.all(preloadImages),
                        timeoutPromise
                    ]);

                    setFoods(validFoods);
                }
            } catch (err) {
                console.error("Failed to fetch foods for slider", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFoods();
    }, [apiBase]);

    useEffect(() => {
        if (isPaused) return;
        if (displayFoods.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % displayFoods.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [isPaused, displayFoods.length]);

    const getSlidePosition = (index) => {
        const total = displayFoods.length;
        if (total === 0) return 'hidden';

        // Calculate normalized offset (-total/2 to total/2)
        let offset = (index - currentSlide) % total;
        if (offset < 0) offset += total;
        if (offset > total / 2) offset -= total;

        if (offset === 0) return 'center';
        if (offset === 1) return 'right1';
        if (offset === 2) return 'right2';
        if (offset === 3) return 'right3';
        if (offset === -1) return 'left1';
        if (offset === -2) return 'left2';
        if (offset === -3) return 'left3';

        // Determine hidden side for smooth exit
        return offset > 0 ? 'hiddenRight' : 'hiddenLeft';
    };

    // State for responsive card positioning
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getCardStyle = (position, index) => {
        const isHovered = hoveredIndex === index;
        const isAnyoneHovered = hoveredIndex !== null;

        // Dynamic spacing based on screen width
        const isMobile = windowWidth < 768;
        const isTablet = windowWidth >= 768 && windowWidth < 1024;

        let spacing = {
            l1: isMobile ? 140 : isTablet ? 180 : 220,
            l2: isMobile ? 260 : isTablet ? 320 : 400,
            l3: isMobile ? 360 : isTablet ? 450 : 540,
            hidden: isMobile ? 420 : 650
        };

        // Base hidden style
        let base = {
            x: 0,
            y: 0,
            scale: 0.6,
            zIndex: 0,
            opacity: 0,
            rotateY: 0,
            rotateZ: 0,
            filter: 'blur(8px) brightness(0.5)'
        };

        // Modern Spread Carousel - Clean & Elegant
        if (position === 'center') {
            base = {
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 50,
                opacity: 1,
                rotateY: 0,
                rotateZ: 0,
                filter: 'blur(0px) brightness(1.05)'
            };
        }
        else if (position === 'left1') {
            base = {
                x: -spacing.l1,
                y: 15,
                scale: 0.82,
                zIndex: 30,
                opacity: 0.85,
                rotateY: 12,
                rotateZ: -3,
                filter: 'blur(0.5px) brightness(0.85)'
            };
        }
        else if (position === 'right1') {
            base = {
                x: spacing.l1,
                y: 15,
                scale: 0.82,
                zIndex: 30,
                opacity: 0.85,
                rotateY: -12,
                rotateZ: 3,
                filter: 'blur(0.5px) brightness(0.85)'
            };
        }
        else if (position === 'left2') {
            base = {
                x: -spacing.l2,
                y: 30,
                scale: 0.65,
                zIndex: 20,
                opacity: 0.6,
                rotateY: 18,
                rotateZ: -5,
                filter: 'blur(1.5px) brightness(0.7)'
            };
        }
        else if (position === 'right2') {
            base = {
                x: spacing.l2,
                y: 30,
                scale: 0.65,
                zIndex: 20,
                opacity: 0.6,
                rotateY: -18,
                rotateZ: 5,
                filter: 'blur(1.5px) brightness(0.7)'
            };
        }
        else if (position === 'left3') {
            base = {
                x: -spacing.l3,
                y: 40,
                scale: 0.5,
                zIndex: 10,
                opacity: 0.35,
                rotateY: 22,
                rotateZ: -6,
                filter: 'blur(3px) brightness(0.6)'
            };
        }
        else if (position === 'right3') {
            base = {
                x: spacing.l3,
                y: 40,
                scale: 0.5,
                zIndex: 10,
                opacity: 0.35,
                rotateY: -22,
                rotateZ: 6,
                filter: 'blur(3px) brightness(0.6)'
            };
        }
        else if (position === 'hiddenRight') {
            base = {
                x: spacing.hidden,
                y: 50,
                scale: 0.4,
                zIndex: 0,
                opacity: 0,
                rotateY: -30,
                rotateZ: 8,
                filter: 'blur(8px) brightness(0.5)'
            };
        }
        else if (position === 'hiddenLeft') {
            base = {
                x: -spacing.hidden,
                y: 50,
                scale: 0.4,
                zIndex: 0,
                opacity: 0,
                rotateY: 30,
                rotateZ: -8,
                filter: 'blur(8px) brightness(0.5)'
            };
        }

        // Elegant Hover Effect
        if (isHovered && position !== 'center') {
            base.scale = base.scale * 1.12;
            base.y = base.y - 15;
            base.zIndex = 45;
            base.opacity = 1;
            base.filter = 'blur(0px) brightness(1.1)';
            base.rotateZ = 0;
        } else if (isAnyoneHovered && !isHovered) {
            base.opacity = base.opacity * 0.7;
            base.filter = `${base.filter} saturate(0.6)`;
        }

        // Apply real-time drag offset for finger-following effect
        // Drag right = positive offset = cards move right
        base.x = base.x + dragOffset;

        return base;
    };

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
                        className="hero-text-wrapper"
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {isLoading ? (
                            <div className="slider-loading">
                                <div className="loading-spinner"></div>
                                <p>กำลังโหลดเมนู...</p>
                            </div>
                        ) : displayFoods.length === 0 ? (
                            <div className="slider-empty">
                                <p>ไม่พบข้อมูลเมนู</p>
                            </div>
                        ) : (
                            <motion.div
                                ref={sliderRef}
                                className="slider-container"
                                aria-label="Food Carousel"
                                onPanStart={() => {
                                    setIsDragging(true);
                                    setDragOffset(0);
                                }}
                                onPan={(e, info) => {
                                    // Real-time finger following - update offset directly
                                    setDragOffset(info.offset.x);
                                }}
                                onPanEnd={handlePanEnd}
                                style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                            >
                                {displayFoods.map((food, index) => {
                                    if (!food) return null; // Safety check
                                    const position = getSlidePosition(index);
                                    const style = getCardStyle(position, index);

                                    return (
                                        <motion.div
                                            key={food?.id || index}
                                            className="hero-card glass-card"
                                            animate={style}
                                            transition={
                                                isDragging
                                                    ? { type: "tween", duration: 0 } // Instant during drag
                                                    : { type: "spring", stiffness: 400, damping: 30, mass: 0.8 } // Spring on release
                                            }
                                            onClick={() => {
                                                if (!isDragging) setCurrentSlide(index);
                                            }}
                                            onMouseEnter={() => handleHover(index)}
                                            onMouseLeave={() => {
                                                if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                                                setHoveredIndex(null);
                                            }}
                                            style={{ position: 'absolute' }}
                                        >
                                            <img src={getImageUrl(food?.image || food?.img)} alt={food?.name || 'Food'} className="card-bg-image" />
                                            <div className="card-overlay" />
                                            <div
                                                className="card-content"
                                                style={{
                                                    opacity: position === 'center' ? 1 : 0,
                                                    pointerEvents: position === 'center' ? 'auto' : 'none',
                                                    transition: 'opacity 0.3s ease'
                                                }}
                                            >
                                                <h3>{food?.name}</h3>
                                                <p>{food?.description || food?.desc}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
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
