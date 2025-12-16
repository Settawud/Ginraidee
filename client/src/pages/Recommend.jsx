import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import confetti from 'canvas-confetti';
import { FiStar } from 'react-icons/fi';
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
    const [showFilters, setShowFilters] = useState(false); // Default to collapsed

    const { foods, loading, updateFilters } = useFoods({
        category: selectedCategories.length > 0 ? selectedCategories : 'all',
        minPrice: priceRange.min,
        maxPrice: priceRange.max
    });

    const { food, getRandomFood, setFood } = useRandomFood();

    // Animation states
    const [animationState, setAnimationState] = useState('idle'); // idle, shuffling, slowing, result
    const [shuffleFood, setShuffleFood] = useState(null);
    const shuffleInterval = useRef(null);

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
        // Fast shuffle phase
        const pool = foods.length > 0 ? foods : [{ image: null, name: '...' }];

        // Immediate set
        setShuffleFood(pool[Math.floor(Math.random() * pool.length)]);

        shuffleInterval.current = setInterval(() => {
            const randomItem = pool[Math.floor(Math.random() * pool.length)];
            setShuffleFood(randomItem);
        }, 80); // Very fast updates
    };

    const handleSpin = async () => {
        if (foods.length === 0) return;

        // Reset if already showing result
        if (animationState === 'result') {
            setAnimationState('idle');
            setFood(null);
            setShuffleFood(null);
            // Small delay before starting next spin if needed, or just proceed
        }

        // 1. Start Shuffling
        setAnimationState('shuffling');
        runShuffleAnimation();

        try {
            // 2. Fetch Result (while shuffling)
            // We use a minimum time to ensure the animation plays long enough
            await Promise.all([
                getRandomFood({
                    category: selectedCategories.length > 0 ? selectedCategories : 'all',
                    minPrice: priceRange.min,
                    maxPrice: priceRange.max
                }),
                new Promise(resolve => setTimeout(resolve, 2000)) // Min shuffle time 2s
            ]);

            // 3. Stop and Reveal (Skipping complex slow down for now)
            if (shuffleInterval.current) clearInterval(shuffleInterval.current);

            setAnimationState('result');
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.7 },
                gravity: 0.8,
                scalar: 1.2
            });

        } catch (error) {
            console.error("Spin error:", error);
            setAnimationState('idle');
            if (shuffleInterval.current) clearInterval(shuffleInterval.current);
        }
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPrice('all');
        setPriceRange({ min: 0, max: 9999 });
        setAnimationState('idle'); // Reset state
        setFood(null);
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
                                {activeFilters > 0 && (
                                    <button className="clear-btn" onClick={clearFilters}>
                                        ล้าง ({activeFilters})
                                    </button>
                                )}
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
                                <motion.div
                                    key="result"
                                    className="result-display"
                                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                >
                                    {/* Hero Image */}
                                    <div className="result-image">
                                        {food.image ? (
                                            <img src={food.image} alt={food.name} />
                                        ) : (
                                            <div className="result-placeholder">
                                                <span>🍽️</span>
                                            </div>
                                        )}
                                        <span className="result-category">{food.categoryName}</span>
                                        <div className="result-flash" />
                                    </div>

                                    {/* Food Info */}
                                    <div className="result-info">
                                        <motion.h2
                                            className="result-name"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            {food.name}
                                        </motion.h2>

                                        {food.nameEn && <p className="result-name-en">{food.nameEn}</p>}
                                        {food.description && <p className="result-desc">{food.description}</p>}

                                        <div className="result-meta">
                                            <span className="result-price">฿{food.price}</span>
                                            <span className="result-rating">
                                                <FiStar className="star-icon" />
                                                {food.rating}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
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

                    {/* Spin Button */}
                    <motion.button
                        className={`spin-button ${animationState === 'shuffling' || animationState === 'slowing' ? 'spinning' : ''} ${animationState === 'result' ? 'reset' : ''}`}
                        onClick={handleSpin}
                        disabled={animationState === 'shuffling' || animationState === 'slowing' || foods.length === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {animationState === 'shuffling' || animationState === 'slowing' ? (
                            <>⏳ กำลังสุ่ม...</>
                        ) : animationState === 'result' ? (
                            <>🔄 สุ่มใหม่</>
                        ) : (
                            <>🎲 สุ่มเลย!</>
                        )}
                    </motion.button>

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

export default Recommend;
