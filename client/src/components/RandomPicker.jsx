import { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import './RandomPicker.css';

const RandomPicker = ({ foods, onResult, filters }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentFood, setCurrentFood] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const spinInterval = useRef(null);

    // Filter foods based on current filters
    const getFilteredFoods = () => {
        let filtered = [...foods];

        if (filters?.category && filters.category !== 'all') {
            filtered = filtered.filter(f => f.category === filters.category);
        }
        if (filters?.minPrice) {
            filtered = filtered.filter(f => f.price >= filters.minPrice);
        }
        if (filters?.maxPrice) {
            filtered = filtered.filter(f => f.price <= filters.maxPrice);
        }

        return filtered.length > 0 ? filtered : foods;
    };

    const triggerConfetti = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                particleCount: Math.floor(count * particleRatio),
                spread: 26,
                startVelocity: 55,
                ...opts
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const spin = async () => {
        if (isSpinning) return;

        const filteredFoods = getFilteredFoods();
        if (filteredFoods.length === 0) return;

        setIsSpinning(true);
        setShowResult(false);

        // Create slot animation items
        const items = [];
        for (let i = 0; i < 20; i++) {
            const randomFood = filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
            items.push(randomFood);
        }

        // Add final result
        const finalFood = filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
        items.push(finalFood);

        // setSlotItems(items);

        // Animate through items
        let index = 0;
        const baseInterval = 50;

        const animateSlot = () => {
            if (index < items.length) {
                setCurrentFood(items[index]);

                // Slow down towards the end
                const progress = index / items.length;
                const delay = baseInterval + (progress * progress * 300);

                index++;
                spinInterval.current = setTimeout(animateSlot, delay);
            } else {
                // Spin complete
                setIsSpinning(false);
                setShowResult(true);
                triggerConfetti();
                onResult?.(finalFood);
            }
        };

        animateSlot();
    };

    const reset = () => {
        setShowResult(false);
        setCurrentFood(null);
    };

    useEffect(() => {
        return () => {
            if (spinInterval.current) {
                clearTimeout(spinInterval.current);
            }
        };
    }, []);

    return (
        <div className="random-picker">
            <div className="picker-container">
                <div className="picker-header">
                    <motion.div
                        className="picker-icon"
                        animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 1, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
                    >
                        🎰
                    </motion.div>
                    <h2 className="picker-title">
                        {showResult ? 'วันนี้กิน...' : 'วันนี้กินอะไรดี?'}
                    </h2>
                </div>

                <div className={`slot-machine ${isSpinning ? 'spinning' : ''} ${showResult ? 'result' : ''}`}>
                    <div className="slot-window">
                        <AnimatePresence mode="wait">
                            {currentFood ? (
                                <motion.div
                                    key={currentFood.id + '-' + Math.random()}
                                    className="slot-item"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -50, opacity: 0 }}
                                    transition={{ duration: isSpinning ? 0.1 : 0.3 }}
                                >
                                    <div
                                        className="slot-food-image"
                                        style={{
                                            background: `linear-gradient(135deg, 
                        hsl(${(currentFood.id * 30) % 360}, 70%, 50%) 0%, 
                        hsl(${(currentFood.id * 30 + 40) % 360}, 80%, 60%) 100%)`
                                        }}
                                    >
                                        <span className="slot-emoji">🍽️</span>
                                    </div>
                                    <div className="slot-food-info">
                                        <h3 className="slot-food-name">{currentFood.name}</h3>
                                        <p className="slot-food-price">฿{currentFood.price}</p>
                                        <span className="slot-food-category">{currentFood.categoryName}</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="slot-placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <span>❓</span>
                                    <p>กดปุ่มเพื่อสุ่มเมนู</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="slot-decorations">
                        <div className="slot-light left" />
                        <div className="slot-light right" />
                    </div>
                </div>

                <div className="picker-actions">
                    {showResult ? (
                        <>
                            <motion.button
                                className="btn btn-primary btn-lg"
                                onClick={spin}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiRefreshCw />
                                สุ่มใหม่
                            </motion.button>
                            <motion.button
                                className="btn btn-secondary"
                                onClick={reset}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiX />
                                ล้าง
                            </motion.button>
                        </>
                    ) : (
                        <motion.button
                            className={`btn btn-primary btn-lg spin-button ${isSpinning ? 'spinning' : ''}`}
                            onClick={spin}
                            disabled={isSpinning}
                            whileHover={!isSpinning ? { scale: 1.05 } : {}}
                            whileTap={!isSpinning ? { scale: 0.95 } : {}}
                        >
                            {isSpinning ? (
                                <>
                                    <FiRefreshCw className="spin-icon" />
                                    กำลังสุ่ม...
                                </>
                            ) : (
                                <>
                                    🎲 สุ่มเลย!
                                </>
                            )}
                        </motion.button>
                    )}
                </div>

                {showResult && currentFood && (
                    <motion.div
                        className="result-details"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <p className="result-description">{currentFood.description}</p>
                        <div className="result-tags">
                            {currentFood.tags?.map(tag => (
                                <span key={tag} className="result-tag">{tag}</span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RandomPicker;
