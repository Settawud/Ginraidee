
import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FiUsers, FiPieChart, FiTrendingUp,
    FiEye, FiRefreshCw, FiCalendar, FiSettings
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../hooks/useFood';
import MenuManagement from '../components/MenuManagement';
import './Admin.css';

const Admin = () => {
    const navigate = useNavigate();
    const { user, isAdmin, loading: authLoading } = useAuth();

    const [stats, setStats] = useState(null);
    const [popularMenus, setPopularMenus] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [dataLoading, setDataLoading] = useState(true);

    // Redirect if not admin (backup check, ProtectedRoute should handle this)
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate('/login', { replace: true });
        }
    }, [authLoading, isAdmin, navigate]);

    // Fetch dashboard data
    useEffect(() => {
        if (isAdmin) {
            fetchDashboardData();
        }
    }, [isAdmin]);

    const fetchDashboardData = async () => {
        try {
            setDataLoading(true);
            const [statsRes, popularRes, categoryRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/popular-menus?limit=10'),
                api.get('/admin/category-stats')
            ]);

            setStats(statsRes.data.data);
            setPopularMenus(popularRes.data.data);
            setCategoryStats(categoryRes.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setDataLoading(false);
        }
    };

    if (authLoading || dataLoading) {
        return (
            <div className="admin-page">
                <div className="admin-loading">
                    <div className="spinner" />
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <motion.header
                    className="admin-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="admin-title">
                        <h1>📊 Admin Dashboard</h1>
                        <p>ภาพรวมระบบ Ginraidee</p>
                        {user && (
                            <span className="admin-welcome">
                                ยินดีต้อนรับ, {user.name || 'Admin'}
                            </span>
                        )}
                    </div>

                    <div className="admin-actions">
                        <button
                            className="refresh-btn"
                            onClick={fetchDashboardData}
                        >
                            <FiRefreshCw />
                            รีเฟรช
                        </button>
                    </div>
                </motion.header>

                <nav className="admin-tabs">
                    <button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''} `}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FiPieChart />
                        ภาพรวม
                    </button>
                    <button
                        className={`tab ${activeTab === 'menus' ? 'active' : ''} `}
                        onClick={() => setActiveTab('menus')}
                    >
                        <FiTrendingUp />
                        เมนูยอดนิยม
                    </button>
                    <button
                        className={`tab ${activeTab === 'users' ? 'active' : ''} `}
                        onClick={() => setActiveTab('users')}
                    >
                        <FiUsers />
                        ผู้ใช้งาน
                    </button>
                    <button
                        className={`tab ${activeTab === 'manage-menus' ? 'active' : ''} `}
                        onClick={() => setActiveTab('manage-menus')}
                    >
                        <FiSettings />
                        จัดการเมนู
                    </button>
                </nav>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && stats && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="tab-content"
                        >
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon users">
                                        <FiUsers />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.totalUsers}</span>
                                        <span className="stat-label">ผู้ใช้ทั้งหมด</span>
                                    </div>
                                    <span className="stat-badge">+{stats.usersToday} วันนี้</span>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon selections">
                                        <FiPieChart />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.totalSelections}</span>
                                        <span className="stat-label">การสุ่มทั้งหมด</span>
                                    </div>
                                    <span className="stat-badge">+{stats.selectionsToday} วันนี้</span>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon views">
                                        <FiEye />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.pageViewsToday}</span>
                                        <span className="stat-label">Page Views วันนี้</span>
                                    </div>
                                </div>
                            </div>

                            {categoryStats.length > 0 && (
                                <div className="category-stats-section">
                                    <h3>หมวดหมู่ยอดนิยม</h3>
                                    <div className="category-bars">
                                        {categoryStats.map((cat, index) => {
                                            const maxCount = categoryStats[0]?.count || 1;
                                            const percentage = (cat.count / maxCount) * 100;

                                            return (
                                                <motion.div
                                                    key={cat.category}
                                                    className="category-bar-item"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className="category-bar-label">
                                                        <span>{cat.categoryName}</span>
                                                        <span>{cat.count} ครั้ง</span>
                                                    </div>
                                                    <div className="category-bar-track">
                                                        <motion.div
                                                            className="category-bar-fill"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}% ` }}
                                                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'menus' && (
                        <motion.div
                            key="menus"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="tab-content"
                        >
                            <div className="popular-menus-section">
                                <h3>🏆 Top 10 เมนูยอดนิยม</h3>

                                {popularMenus.length === 0 ? (
                                    <div className="empty-menus">
                                        <p>ยังไม่มีข้อมูลการสุ่ม</p>
                                    </div>
                                ) : (
                                    <div className="popular-list">
                                        {popularMenus.map((item, index) => (
                                            <motion.div
                                                key={item.food_id}
                                                className="popular-item"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <span className="rank">#{index + 1}</span>
                                                <div
                                                    className="popular-image"
                                                    style={{
                                                        background: `linear - gradient(135deg,
    hsl(${(item.food.id * 30) % 360}, 70 %, 50 %) 0 %,
    hsl(${(item.food.id * 30 + 40) % 360}, 80 %, 60 %) 100 %)`
                                                    }}
                                                >
                                                    🍽️
                                                </div>
                                                <div className="popular-info">
                                                    <span className="popular-name">{item.food.name}</span>
                                                    <span className="popular-category">{item.food.categoryName}</span>
                                                </div>
                                                <div className="popular-count">
                                                    <span className="count-value">{item.selection_count}</span>
                                                    <span className="count-label">ครั้ง</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && stats && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="tab-content"
                        >
                            <div className="users-section">
                                <h3>📈 ผู้ใช้งานในช่วง 7 วันที่ผ่านมา</h3>

                                {stats.usersByDay?.length > 0 ? (
                                    <div className="users-chart">
                                        {stats.usersByDay.map((day, index) => {
                                            const maxCount = Math.max(...stats.usersByDay.map(d => d.count)) || 1;
                                            const height = (day.count / maxCount) * 100;

                                            return (
                                                <motion.div
                                                    key={day.date}
                                                    className="chart-bar"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(height, 5)}% ` }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <span className="bar-value">{day.count}</span>
                                                    <span className="bar-date">{formatDate(day.date)}</span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="empty-chart">
                                        <FiCalendar />
                                        <p>ยังไม่มีข้อมูลผู้ใช้</p>
                                    </div>
                                )}
                            </div>

                            <div className="selections-section">
                                <h3>🎲 การสุ่มในช่วง 7 วันที่ผ่านมา</h3>

                                {stats.selectionsByDay?.length > 0 ? (
                                    <div className="users-chart">
                                        {stats.selectionsByDay.map((day, index) => {
                                            const maxCount = Math.max(...stats.selectionsByDay.map(d => d.count)) || 1;
                                            const height = (day.count / maxCount) * 100;

                                            return (
                                                <motion.div
                                                    key={day.date}
                                                    className="chart-bar selections"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(height, 5)}% ` }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <span className="bar-value">{day.count}</span>
                                                    <span className="bar-date">{formatDate(day.date)}</span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="empty-chart">
                                        <FiCalendar />
                                        <p>ยังไม่มีข้อมูลการสุ่ม</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'manage-menus' && (
                        <motion.div
                            key="manage-menus"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="tab-content"
                        >
                            <MenuManagement />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short'
    });
};

export default Admin;
