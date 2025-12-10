import { motion } from 'framer-motion';
import './CategoryFilter.css';

const CategoryFilter = ({ categories, selected, onSelect }) => {
    return (
        <div className="category-filter">
            <div className="category-filter-scroll">
                {categories.map((category, index) => (
                    <motion.button
                        key={category.id}
                        className={`category-chip ${selected === category.id ? 'active' : ''}`}
                        onClick={() => onSelect(category.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="category-icon">
                            {getCategoryIcon(category.id)}
                        </span>
                        <span className="category-name">{category.name}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

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

export default CategoryFilter;
