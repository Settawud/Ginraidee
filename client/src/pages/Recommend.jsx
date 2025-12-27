import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FiStar, FiX, FiThumbsUp, FiThumbsDown, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useFoods, useCategories, useRandomFood } from '../hooks/useFood';
import './Recommend.css';

// Category icons mapping
const getCategoryIcon = (categoryId) => {
    const icons = {
        all: '🍽️',
        thai: '🇹🇭',
        japanese: '🇯🇵',
        korean: '🇰🇷',
        western: '🍝',
        fastfood: '🍔',
        dessert: '🍰'
    };
    return icons[categoryId] || '🍴';
};

// Price range config
const priceRanges = [
    { id: 'all', name: 'ทุกราคา', min: 0, max: 9999, level: 0 },
    { id: 'cheap', name: 'ถูก', label: '< ฿50', min: 0, max: 50, level: 1 },
    { id: 'medium', name: 'กลาง', label: '฿50-150', min: 50, max: 150, level: 2 },
    { id: 'expensive', name: 'แพง', label: '> ฿150', min: 150, max: 9999, level: 3 }
];

const Recommend = () => {
    const { categories } = useCategories();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPrice, setSelectedPrice] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
    const [showFilters, setShowFilters] = useState(false);

    const { foods, loading, updateFilters } = useFoods({
        category: selectedCategories.length > 0 ? selectedCategories : 'all',
        minPrice: priceRange.min,
        maxPrice: priceRange.max
    });

    const { food, getRandomFood, setFood, sendFeedback, getStats } = useRandomFood();

    // Animation states
    const [animationState, setAnimationState] = useState('idle'); // idle, shuffling, slowing, result
    const [shuffleFood, setShuffleFood] = useState(null);
    const shuffleInterval = useRef(null);

    // Feedback & Stats Logic
    const [userId, setUserId] = useState(null);
    const [stats, setStats] = useState({ likes: 0, dislikes: 0 });
    const [showStats, setShowStats] = useState(false);

    // Initialize User ID
    useEffect(() => {
        let storedId = localStorage.getItem('ginraidee_uid');
        if (!storedId) {
            storedId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ginraidee_uid', storedId);
        }
        setUserId(storedId);
    }, []);

    // Sync filters when category or price changes
    useEffect(() => {
        updateFilters({
            category: selectedCategories.length > 0 ? selectedCategories : 'all',
            minPrice: priceRange.min,
            maxPrice: priceRange.max
        });
    }, [selectedCategories, priceRange, updateFilters]);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        fetch(`${apiBase}/users/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 'recommend' }),
            credentials: 'include'
        }).catch(() => { });

        return () => {
            if (shuffleInterval.current) clearInterval(shuffleInterval.current);
        };
    }, []);

    const handlePriceSelect = (range) => {
        setSelectedPrice(range.id);
        setPriceRange({ min: range.min, max: range.max });
    };

    const runShuffleAnimation = () => {
        const pool = foods.length > 0 ? foods : [{ image: null, name: '...' }];
        setShuffleFood(pool[Math.floor(Math.random() * pool.length)]);
        shuffleInterval.current = setInterval(() => {
            const randomItem = pool[Math.floor(Math.random() * pool.length)];
            setShuffleFood(randomItem);
        }, 80);
    };

    const handleSpin = async () => {
        if (foods.length === 0) return;

        if (animationState === 'result') {
            setAnimationState('idle');
            setFood(null);
            setShuffleFood(null);
            setShowStats(false);
        }

        setAnimationState('shuffling');
        runShuffleAnimation();

        try {
            await Promise.all([
                getRandomFood({
                    category: selectedCategories.length > 0 ? selectedCategories : 'all',
                    minPrice: priceRange.min,
                    maxPrice: priceRange.max,
                    userId // Pass userId for exclusion
                }),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);

            if (shuffleInterval.current) clearInterval(shuffleInterval.current);

            setAnimationState('result');
            // Confetti is now triggered on "Like" or just reveal? 
            // Let's keep confetti for the "Got a Match" moment
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

        } catch (error) {
            console.error("Spin error:", error);
            setAnimationState('idle');
            if (shuffleInterval.current) clearInterval(shuffleInterval.current);
        }
    };

    const handleSwipe = async (direction) => {
        if (!food || !userId) return;

        const action = direction === 'right' ? 'like' : 'dislike';

        // Optimistic UI update
        if (action === 'like') {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.7 },
                colors: ['#EF4444', '#10B981'] // Red/Green for fun
            });
        }

        // Send feedback
        await sendFeedback(food.id, action, userId);

        // Reset to idle state or auto-spin after swipe animation
        setTimeout(() => {
            if (action === 'dislike') {
                handleSpin();
            } else {
                setFood(null);
                setShuffleFood(null);
                setAnimationState('idle');
            }
        }, 200);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPrice('all');
        setPriceRange({ min: 0, max: 9999 });
        setAnimationState('idle');
        setFood(null);
        setShowStats(false);
    };

    const toggleCategory = (id) => {
        if (id === 'all') {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(prev => {
                if (prev.includes(id)) {
                    return prev.filter(c => c !== id);
                } else {
                    return [...prev, id];
                }
            });
        }
    };

    const activeFilters = (selectedCategories.length > 0 ? selectedCategories.length : 0) + (selectedPrice !== 'all' ? 1 : 0);

    return (
        <div className="recommend-page">
            {/* Background Effects */}
            <div className="recommend-bg">
                <div className="bg-glow bg-glow-1" />
                <div className="bg-glow bg-glow-2" />
            </div>

            <div className="recommend-layout">
                <AnimatePresence>
                    {showFilters && (
                        <motion.aside
                            className="filter-sidebar"
                            initial={{ width: 0, opacity: 0, x: -20 }}
                            animate={{ width: 280, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            <div className="sidebar-header">
                                <h2 className="sidebar-title">🎛️ ตัวกรอง</h2>
                                <div className="header-actions">
                                    {activeFilters > 0 && (
                                        <button className="clear-btn" onClick={clearFilters}>
                                            ล้าง ({activeFilters})
                                        </button>
                                    )}
                                    <button className="sidebar-close-btn" onClick={() => setShowFilters(false)}>
                                        <FiX />
                                    </button>
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="filter-group">
                                <h3 className="filter-label">หมวดหมู่</h3>
                                <div className="filter-options">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            className={`filter-option ${cat.id === 'all'
                                                ? selectedCategories.length === 0 ? 'active' : ''
                                                : selectedCategories.includes(cat.id) ? 'active' : ''
                                                }`}
                                            onClick={() => toggleCategory(cat.id)}
                                        >
                                            <span className="option-icon">{getCategoryIcon(cat.id)}</span>
                                            <span className="option-name">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div className="filter-group">
                                <h3 className="filter-label">ช่วงราคา</h3>
                                <div className="filter-options price-options">
                                    {priceRanges.map((range) => (
                                        <button
                                            key={range.id}
                                            className={`filter-option price-option ${selectedPrice === range.id ? 'active' : ''}`}
                                            onClick={() => handlePriceSelect(range)}
                                        >
                                            <span className="price-level">
                                                {range.level === 0 ? '∞' :
                                                    [...Array(range.level)].map((_, i) => (
                                                        <span key={i} className="baht-icon">฿</span>
                                                    ))
                                                }
                                            </span>
                                            <span className="option-name">{range.name}</span>
                                            {range.label && <span className="price-label">{range.label}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Count */}
                            <div className="menu-count">
                                <span className="count-number">{foods.length}</span>
                                <span className="count-label">เมนูพร้อมสุ่ม</span>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Right Side - Main Content */}
                <motion.main
                    className="main-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Header */}
                    <div className="main-header">
                        <motion.button
                            className={`filter-toggle-btn ${showFilters ? 'active' : ''} ${activeFilters > 0 ? 'has-filters' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="toggle-icon">🎛️</span>
                            <span className="toggle-text">{showFilters ? 'ปิดตัวกรอง' : 'ตัวกรอง'}</span>
                            {!showFilters && activeFilters > 0 && (
                                <span className="filter-badge">{activeFilters}</span>
                            )}
                        </motion.button>

                        <h1 className="main-title">
                            <span className="title-icon">🎲</span>
                            {food ? 'วันนี้กิน...' : 'วันนี้กินอะไรดี?'}
                        </h1>
                    </div>

                    {/* Slot Display */}
                    <div className="slot-area">
                        <AnimatePresence mode="wait">
                            {(animationState === 'shuffling' || animationState === 'slowing') && shuffleFood ? (
                                <motion.div
                                    key="shuffling"
                                    className={`spin-state ${animationState === 'shuffling' ? 'is-blur' : ''}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="spin-image">
                                        {shuffleFood.image ? (
                                            <img src={shuffleFood.image} alt={shuffleFood.name} />
                                        ) : (
                                            <span className="spin-emoji">🍽️</span>
                                        )}
                                    </div>
                                    <p className="spin-name">{shuffleFood.name}</p>
                                </motion.div>
                            ) : animationState === 'result' && food ? (
                                <SwipeableCard
                                    key="swipe-card"
                                    food={food}
                                    onSwipe={handleSwipe}
                                />
                            ) : (
                                <motion.div
                                    key="idle"
                                    className="idle-area"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="idle-icon">🎰</div>
                                    <p className="idle-text">กดปุ่มเพื่อสุ่มเมนู</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Spin Button - Hide when in result/swipe mode until stats show */}
                    {animationState !== 'result' && (
                        <motion.button
                            className={`spin-button ${animationState === 'shuffling' || animationState === 'slowing' ? 'spinning' : ''}`}
                            onClick={handleSpin}
                            disabled={animationState === 'shuffling' || animationState === 'slowing' || foods.length === 0}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {animationState === 'shuffling' || animationState === 'slowing' ? (
                                <>⏳ กำลังสุ่ม...</>
                            ) : (
                                <>🎲 สุ่มเลย!</>
                            )}
                        </motion.button>
                    )}

                    {/* Loading / Empty State */}
                    {loading && (
                        <div className="state-message">
                            <div className="loader" />
                            <p>กำลังโหลดเมนู...</p>
                        </div>
                    )}

                    {!loading && foods.length === 0 && (
                        <div className="state-message empty">
                            <span>🍽️</span>
                            <p>ไม่พบเมนูที่ตรงกับตัวกรอง</p>
                            <button className="reset-btn" onClick={clearFilters}>
                                ล้างตัวกรอง
                            </button>
                        </div>
                    )}
                </motion.main>
            </div>
        </div>
    );
};

// Sub-components for better organization
const SwipeableCard = ({ food, onSwipe }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    // Convert x to color/opacity for overlays
    const likeOpacity = useTransform(x, [0, 150], [0, 1]);
    const dislikeOpacity = useTransform(x, [0, -150], [0, 1]);

    // Hint opacity - fade out when dragging starts
    const hintOpacity = useTransform(x, [-50, 0, 50], [0, 1, 0]);

    const handleDragEnd = (e, { offset, velocity }) => {
        const swipeThreshold = 100;
        if (offset.x > swipeThreshold) {
            onSwipe('right');
        } else if (offset.x < -swipeThreshold) {
            onSwipe('left');
        }
    };

    const handleButtonClick = async (direction) => {
        const targetX = direction === 'right' ? 300 : -300;
        // Animate card off screen
        await animate(x, targetX, { duration: 0.3 });
        onSwipe(direction);
    };

    return (
        <motion.div
            className="swipe-card-container"
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                rotate: [0, -2, 2, -2, 2, 0], // Wiggle to hint swipe
                transition: {
                    scale: { duration: 0.3 },
                    opacity: { duration: 0.3 },
                    rotate: { delay: 0.6, duration: 0.5, ease: "easeInOut" }
                }
            }}
            exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2 } }}
        >
            {/* Overlays */}
            <motion.div className="swipe-overlay like" style={{ opacity: likeOpacity }}>
                <FiThumbsUp /> ชอบ
            </motion.div>
            <motion.div className="swipe-overlay dislike" style={{ opacity: dislikeOpacity }}>
                <FiThumbsDown /> ไม่ชอบ
            </motion.div>

            {/* Side Hints - Clickable */}
            <motion.div
                className="swipe-hint-side left"
                style={{ opacity: hintOpacity }}
                onClick={(e) => { e.stopPropagation(); handleButtonClick('left'); }}
            >
                <div className="hint-icon dislike"><FiThumbsDown /></div>
                <span className="hint-label">ไม่ชอบ</span>
            </motion.div>
            <motion.div
                className="swipe-hint-side right"
                style={{ opacity: hintOpacity }}
                onClick={(e) => { e.stopPropagation(); handleButtonClick('right'); }}
            >
                <span className="hint-label">ชอบ</span>
                <div className="hint-icon like"><FiThumbsUp /></div>
            </motion.div>

            <div className="result-display swipable">
                <div className="result-image">
                    {food.image ? (
                        <img src={food.image} alt={food.name} draggable="false" />
                    ) : (
                        <div className="result-placeholder">
                            <span>🍽️</span>
                        </div>
                    )}
                    <span className="result-category">{food.categoryName}</span>
                </div>

                <div className="result-info">
                    <h2 className="result-name">{food.name}</h2>
                    <div className="result-meta">
                        <span className="result-price">฿{food.price}</span>
                        <span className="result-rating">★ {food.rating}</span>
                    </div>
                </div>

                <div className="swipe-instruction">
                    <FiArrowLeft /> ปัดซ้าย "ไม่ชอบ" | ปัดขวา "ชอบ" <FiArrowRight />
                </div>
            </div>
        </motion.div>
    );
};

const StatsView = ({ food, stats, onRestart }) => {
    // Determine sentiment
    const total = stats.likes + stats.dislikes;
    const likePercent = total > 0 ? Math.round((stats.likes / total) * 100) : 0;

    return (
        <motion.div
            className="stats-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <h3>สถิติวันนี้สำหรับ "{food.name}"</h3>

            <div className="stats-bar-container">
                <div className="stats-numbers">
                    <span className="stat-like"><FiThumbsUp /> {stats.likes} คนชอบ</span>
                    <span className="stat-dislike"><FiThumbsDown /> {stats.dislikes} ไม่ชอบ</span>
                </div>
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${likePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
                <p className="stats-summary">
                    {total === 0 ? "คุณเป็นคนแรกที่ให้คะแนนวันนี้!" :
                        likePercent >= 80 ? "🔥 เมนูนี้ฮอตมาก ใครๆ ก็กิน!" :
                            likePercent >= 50 ? "👍 เมนูยอดนิยม อร่อยแน่นอน" :
                                "🤔 เมนูนี้คนเสียงแตก ลองพิสูจน์ด้วยตัวเอง!"}
                </p>
            </div>

            <button className="btn btn-primary btn-lg mt-4" onClick={onRestart}>
                🔄 สุ่มเมนูอื่น
            </button>
        </motion.div>
    );
};



export default Recommend;
