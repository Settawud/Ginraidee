
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiCompass, FiGrid, FiSettings, FiMenu, FiX, FiLogIn, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();

    const navItems = [
        { path: '/', label: 'หน้าแรก', icon: FiHome },
        { path: '/recommend', label: 'สุ่มเมนู', icon: FiCompass },
        { path: '/menu', label: 'เมนูทั้งหมด', icon: FiGrid },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    return (
        <motion.header
            className="header"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <span className="logo-icon">🍜</span>
                    <span className="logo-text">Ginraidee</span>
                </Link>

                <nav className={`header - nav ${mobileMenuOpen ? 'open' : ''} `}>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav - link ${location.pathname === item.path ? 'active' : ''} `}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <item.icon className="nav-icon" />
                            <span>{item.label}</span>
                            {location.pathname === item.path && (
                                <motion.div
                                    className="nav-indicator"
                                    layoutId="nav-indicator"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}

                    {/* Admin link - only show for admin users */}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`nav - link ${location.pathname === '/admin' ? 'active' : ''} `}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <FiSettings className="nav-icon" />
                            <span>แอดมิน</span>
                            {location.pathname === '/admin' && (
                                <motion.div
                                    className="nav-indicator"
                                    layoutId="nav-indicator"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    )}
                </nav>

                <div className="header-actions">
                    {/* User section */}
                    {!loading && (
                        <AnimatePresence mode="wait">
                            {isAuthenticated ? (
                                <motion.div
                                    key="user-menu"
                                    className="user-menu"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {/* User Avatar/Info */}
                                    <div className="user-info">
                                        {user?.picture ? (
                                            <img
                                                src={user.picture}
                                                alt={user.name}
                                                className="user-avatar"
                                            />
                                        ) : (
                                            <div className="user-avatar-placeholder">
                                                <FiUser />
                                            </div>
                                        )}
                                        <span className="user-name hide-mobile">
                                            {user?.name || 'Admin'}
                                        </span>
                                        {isAdmin && (
                                            <span className="admin-badge">Admin</span>
                                        )}
                                    </div>

                                    {/* Logout button */}
                                    <button
                                        className="logout-btn"
                                        onClick={handleLogout}
                                        title="ออกจากระบบ"
                                    >
                                        <FiLogOut />
                                        <span className="hide-mobile">ออก</span>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="login-btn"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <Link to="/login" className="login-link">
                                        <FiLogIn />
                                        <span className="hide-mobile">เข้าสู่ระบบ</span>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    <button
                        className="mobile-menu-btn hide-desktop"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <motion.div
                    className="mobile-menu-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </motion.header>
    );
};

export default Header;
