import { motion } from 'framer-motion';
import { FiStar, FiDollarSign, FiTag } from 'react-icons/fi';
import { useState } from 'react';
import './FoodCard.css';

const FoodCard = ({ food, onClick, isSpinning, delay = 0 }) => {
    const priceLevel = food.price < 50 ? 1 : food.price < 150 ? 2 : 3;
    const [imageError, setImageError] = useState(false);

    return (
        <motion.div
            className={`food-card ${isSpinning ? 'spinning' : ''}`}
            onClick={() => onClick?.(food)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            whileHover={{
                y: -12,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="food-card-image">
                {food.image && !imageError ? (
                    <img
                        src={food.image}
                        alt={food.name}
                        className="food-card-img"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div
                        className="food-card-image-bg"
                        style={{
                            background: `linear-gradient(135deg, 
                  hsl(${(food.id * 30) % 360}, 70%, 50%) 0%, 
                  hsl(${(food.id * 30 + 40) % 360}, 80%, 60%) 100%)`
                        }}
                    >
                        <span className="food-emoji">🍽️</span>
                    </div>
                )}
                <div className="food-card-overlay">
                    <span className="food-card-category">{food.categoryName}</span>
                </div>
            </div>

            <div className="food-card-content">
                <h3 className="food-card-title">{food.name}</h3>
                <p className="food-card-name-en">{food.nameEn}</p>
                <p className="food-card-description">{food.description}</p>

                <div className="food-card-footer">
                    <div className="food-card-price">
                        <span className="price-amount">฿{food.price}</span>
                        <span className="price-level">
                            {[...Array(priceLevel)].map((_, i) => (
                                <FiDollarSign key={i} className="price-icon active" />
                            ))}
                            {[...Array(3 - priceLevel)].map((_, i) => (
                                <FiDollarSign key={i} className="price-icon" />
                            ))}
                        </span>
                    </div>

                    <div className="food-card-rating">
                        <FiStar className="star-icon" />
                        <span>{food.rating}</span>
                    </div>
                </div>

                <div className="food-card-tags">
                    {food.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="food-tag">
                            <FiTag size={10} />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="food-card-glow" />
        </motion.div>
    );
};

export default FoodCard;
