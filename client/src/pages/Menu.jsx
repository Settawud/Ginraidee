import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import FoodCard from '../components/FoodCard';
import CategoryFilter from '../components/CategoryFilter';
import { useFoods, useCategories } from '../hooks/useFood';
import './Menu.css';

const Menu = () => {
    const { categories } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('name');

    const { foods, loading } = useFoods({
        category: selectedCategory,
        search: searchTerm
    });

    useEffect(() => {
        // Track page view
        fetch('http://localhost:3001/api/users/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 'menu' }),
            credentials: 'include'
        }).catch(() => { });
    }, []);

    // Sort foods
    const sortedFoods = [...foods].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'name':
            default:
                return a.name.localeCompare(b.name, 'th');
        }
    });

    return (
        <div className="menu-page">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <header className="menu-header">
                        <h1 className="page-title">
                            <span className="emoji">📋</span>
                            เมนูทั้งหมด
                        </h1>
                        <p className="page-subtitle">
                            รวม {foods.length} เมนูอร่อยรอคุณอยู่
                        </p>
                    </header>

                    <div className="menu-controls">
                        <div className="search-wrapper">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="ค้นหาเมนู..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="search-clear"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>

                        <div className="control-buttons">
                            <button
                                className={`filter-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FiFilter />
                                ตัวกรอง
                            </button>

                            <select
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name">เรียงตามชื่อ</option>
                                <option value="price-low">ราคา: ต่ำ → สูง</option>
                                <option value="price-high">ราคา: สูง → ต่ำ</option>
                                <option value="rating">คะแนนสูงสุด</option>
                            </select>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                className="filters-panel"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <CategoryFilter
                                    categories={categories}
                                    selected={selectedCategory}
                                    onSelect={(cat) => {
                                        setSelectedCategory(cat);
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div className="loading-grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="skeleton-card">
                                    <div className="skeleton skeleton-image" />
                                    <div className="skeleton-content">
                                        <div className="skeleton skeleton-title" />
                                        <div className="skeleton skeleton-text" />
                                        <div className="skeleton skeleton-text short" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sortedFoods.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🔍</span>
                            <h3>ไม่พบเมนูที่ค้นหา</h3>
                            <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                            >
                                ล้างการค้นหา
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            className="menu-grid"
                            layout
                        >
                            <AnimatePresence>
                                {sortedFoods.map((food, index) => (
                                    <FoodCard
                                        key={food.id}
                                        food={food}
                                        delay={index * 0.03}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Menu;
