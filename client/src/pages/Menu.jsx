import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiDollarSign } from 'react-icons/fi';
import FoodCard from '../components/FoodCard';
import { useFoods, useCategories } from '../hooks/useFood';
import './Menu.css';

// Category icons mapping (Same as Recommend.jsx)
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

const Menu = () => {
    const { categories } = useCategories();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPrice, setSelectedPrice] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const { foods, loading, updateFilters } = useFoods({
        category: selectedCategories.length > 0 ? selectedCategories : 'all',
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        search: searchTerm
    });

    // Sync filters
    useEffect(() => {
        updateFilters({
            category: selectedCategories.length > 0 ? selectedCategories : 'all',
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
            search: searchTerm
        });
    }, [selectedCategories, priceRange, searchTerm, updateFilters]);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        fetch(`${apiBase}/users/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 'menu' }),
            credentials: 'include'
        }).catch(() => { });
    }, []);

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

    const handlePriceSelect = (range) => {
        setSelectedPrice(range.id);
        setPriceRange({ min: range.min, max: range.max });
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPrice('all');
        setPriceRange({ min: 0, max: 9999 });
        setSearchTerm('');
    };

    const activeFiltersCount = (selectedCategories.length > 0 ? selectedCategories.length : 0) + (selectedPrice !== 'all' ? 1 : 0);

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
            <div className="menu-bg">
                <div className="bg-glow bg-glow-1" />
                <div className="bg-glow bg-glow-2" />
            </div>

            <div className="menu-layout">
                {/* --- Sidebar Filters --- */}
                <aside className={`menu-sidebar ${showMobileFilters ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h2 className="sidebar-title">🎛️ ตัวกรอง</h2>
                        <div className="sidebar-actions">
                            {activeFiltersCount > 0 && (
                                <button className="clear-btn" onClick={clearFilters}>
                                    ล้าง ({activeFiltersCount})
                                </button>
                            )}
                            <button className="mobile-close-btn" onClick={() => setShowMobileFilters(false)}>
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
                </aside>

                {/* --- Main Content --- */}
                <main className="menu-main">
                    <header className="menu-main-header">
                        <div className="header-titles">
                            <h1 className="page-title">
                                <span className="title-icon">📋</span>
                                เมนูทั้งหมด
                            </h1>
                            <p className="page-subtitle">
                                มี {foods.length} เมนูอร่อยรอคุณอยู่
                            </p>
                        </div>

                        <div className="header-controls">
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
                                    <button className="search-clear" onClick={() => setSearchTerm('')}>
                                        <FiX />
                                    </button>
                                )}
                            </div>

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

                            <button
                                className="mobile-filter-toggle"
                                onClick={() => setShowMobileFilters(true)}
                            >
                                🎛️ ตัวกรอง
                                {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
                            </button>
                        </div>
                    </header>

                    {loading ? (
                        <div className="loading-grid">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="skeleton-card">
                                    <div className="skeleton skeleton-image" />
                                    <div className="skeleton-content">
                                        <div className="skeleton skeleton-title" />
                                        <div className="skeleton skeleton-text" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sortedFoods.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🔍</span>
                            <h3>ไม่พบเมนูที่ค้นหา</h3>
                            <button className="btn btn-secondary" onClick={clearFilters}>
                                ล้างตัวกรอง
                            </button>
                        </div>
                    ) : (
                        <motion.div className="menu-grid" layout>
                            <AnimatePresence>
                                {sortedFoods.map((food, index) => (
                                    <FoodCard key={food.id} food={food} delay={index * 0.03} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Menu;
