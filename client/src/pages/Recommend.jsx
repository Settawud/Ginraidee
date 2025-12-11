import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi';
import CategoryFilter from '../components/CategoryFilter';
import PriceFilter from '../components/PriceFilter';
import FoodCard from '../components/FoodCard';
import { useFoods, useCategories, useRandomFood, api } from '../hooks/useFood';
import { useAuth } from '../contexts/AuthContext';
import './Recommend.css';

const Recommend = () => {
    const { user } = useAuth();
    const { categories } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedPrice, setSelectedPrice] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
    const [showFilters, setShowFilters] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null

    const { foods, loading } = useFoods({
        category: selectedCategory,
        minPrice: priceRange.min,
        maxPrice: priceRange.max
    });

    const { food, spinning, getRandomFood, setFood } = useRandomFood();

    useEffect(() => {
        // Track page view
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        fetch(`${apiBase}/users/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 'recommend' }),
            credentials: 'include'
        }).catch(() => { });
    }, []);

    const handlePriceSelect = (range) => {
        setSelectedPrice(range.id);
        setPriceRange({ min: range.min, max: range.max });
    };

    const handleSpin = async () => {
        if (food) {
            // Reset
            setFood(null);
            setFeedback(null);
        } else {
            // Spin with current filters
            setFeedback(null);
            await getRandomFood({
                category: selectedCategory,
                minPrice: priceRange.min,
                maxPrice: priceRange.max
            });

            // Confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const handleFeedback = async (type) => {
        if (feedback || !food) return; // Already given feedback or no food

        setFeedback(type);

        try {
            await api.post('/foods/feedback', {
                userId: user?.id,
                foodId: food.id,
                feedback: type // 'like' or 'dislike'
            });
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    // Get active filter count
    const activeFilters = (selectedCategory !== 'all' ? 1 : 0) + (selectedPrice !== 'all' ? 1 : 0);

    return (
        <div className="recommend-page">
            <div className="recommend-center">
                <motion.div
                    className="picker-container"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Filter Toggle */}
                    <button
                        className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        🎛️ ตัวกรอง {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
                    </button>

                    {/* Filters Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                className="filters-panel"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <div className="filter-row">
                                    <CategoryFilter
                                        categories={categories}
                                        selected={selectedCategory}
                                        onSelect={setSelectedCategory}
                                    />
                                </div>
                                <div className="filter-row">
                                    <PriceFilter
                                        selected={selectedPrice}
                                        onSelect={handlePriceSelect}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Picker Area */}
                    <div className="picker-main">
                        <h1 className="picker-title">
                            {food ? '🎉 วันนี้กิน...' : '🎲 วันนี้กินอะไรดี?'}
                        </h1>

                        {/* Slot Machine / Result Display */}
                        <div className="slot-display">
                            <AnimatePresence mode="wait">
                                {spinning && food ? (
                                    <motion.div
                                        key="spinning"
                                        className="spinning-card"
                                        initial={{ opacity: 0, y: -50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 50 }}
                                    >
                                        <div className="slot-food-image">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} />
                                            ) : (
                                                <span className="slot-emoji">🍽️</span>
                                            )}
                                        </div>
                                        <p className="slot-food-name">{food.name}</p>
                                    </motion.div>
                                ) : food && !spinning ? (
                                    <motion.div
                                        key="result"
                                        className="result-display"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', damping: 15 }}
                                    >
                                        <FoodCard food={food} />

                                        {/* Like/Dislike Buttons */}
                                        <motion.div
                                            className="feedback-buttons"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <p className="feedback-question">เมนูนี้ถูกใจไหม?</p>
                                            <div className="feedback-actions">
                                                <motion.button
                                                    className={`feedback-btn like ${feedback === 'like' ? 'active' : ''}`}
                                                    onClick={() => handleFeedback('like')}
                                                    disabled={!!feedback}
                                                    whileHover={{ scale: feedback ? 1 : 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {feedback === 'like' ? <FiCheck /> : <FiThumbsUp />}
                                                    <span>ถูกใจ!</span>
                                                </motion.button>
                                                <motion.button
                                                    className={`feedback-btn dislike ${feedback === 'dislike' ? 'active' : ''}`}
                                                    onClick={() => handleFeedback('dislike')}
                                                    disabled={!!feedback}
                                                    whileHover={{ scale: feedback ? 1 : 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {feedback === 'dislike' ? <FiCheck /> : <FiThumbsDown />}
                                                    <span>ไม่ใช่</span>
                                                </motion.button>
                                            </div>
                                            {feedback && (
                                                <motion.p
                                                    className="feedback-thanks"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    ขอบคุณสำหรับ feedback! 🙏
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        className="idle-display"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <div className="slot-machine-icon">🎰</div>
                                        <p className="idle-text">กดปุ่มเพื่อสุ่มเมนู!</p>
                                        {foods.length > 0 && (
                                            <p className="foods-count">{foods.length} เมนูพร้อมให้สุ่ม</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Spin Button */}
                        <motion.button
                            className={`spin-button ${spinning ? 'spinning' : ''} ${food && !spinning ? 'reset' : ''}`}
                            onClick={handleSpin}
                            disabled={spinning || foods.length === 0}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {spinning ? (
                                <>⏳ กำลังสุ่ม...</>
                            ) : food ? (
                                <>🔄 สุ่มใหม่</>
                            ) : (
                                <>🎲 สุ่มเลย!</>
                            )}
                        </motion.button>

                        {/* Loading / Empty State */}
                        {loading && (
                            <div className="loading-state">
                                <div className="spinner" />
                                <p>กำลังโหลดเมนู...</p>
                            </div>
                        )}

                        {!loading && foods.length === 0 && (
                            <div className="empty-state">
                                <p>🍽️ ไม่พบเมนูที่ตรงกับตัวกรอง</p>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setSelectedPrice('all');
                                        setPriceRange({ min: 0, max: 9999 });
                                    }}
                                >
                                    ล้างตัวกรอง
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Recommend;
