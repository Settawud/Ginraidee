import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAdmin, loginWithGoogle, loginWithCredentials, loading } = useAuth();

    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && !loading) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, loading, navigate, location]);

    // Check for OAuth callback errors
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('error')) {
            setLoginError('การเข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่อีกครั้ง');
        }
    }, [location]);

    const handleGoogleLogin = () => {
        loginWithGoogle();
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsSubmitting(true);

        const result = await loginWithCredentials(
            adminCredentials.username,
            adminCredentials.password
        );

        if (!result.success) {
            setLoginError(result.error);
        }

        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <div className="login-page">
                <div className="login-loading">
                    <div className="spinner" />
                    <p>กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <motion.div
                    className="login-card glass-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="login-header">
                        <div className="login-logo">
                            <span className="logo-emoji">🍜</span>
                            <h1>Ginraidee</h1>
                        </div>
                        <p className="login-subtitle">
                            {showAdminLogin
                                ? 'เข้าสู่ระบบสำหรับผู้ดูแลระบบ'
                                : 'เข้าสู่ระบบเพื่อใช้งาน'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {loginError && (
                        <motion.div
                            className="login-error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {loginError}
                        </motion.div>
                    )}

                    {!showAdminLogin ? (
                        /* User Login */
                        <div className="user-login-section">
                            {/* Google Login Button */}
                            <motion.button
                                className="google-login-btn"
                                onClick={handleGoogleLogin}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <FcGoogle className="google-icon" />
                                <span>เข้าสู่ระบบด้วย Google</span>
                            </motion.button>

                            <div className="login-divider">
                                <span>หรือ</span>
                            </div>

                            {/* Continue without login */}
                            <Link to="/" className="continue-guest">
                                <FiArrowLeft />
                                <span>ใช้งานโดยไม่ต้องเข้าสู่ระบบ</span>
                            </Link>

                            {/* Admin login link */}
                            <button
                                className="admin-login-link"
                                onClick={() => setShowAdminLogin(true)}
                            >
                                <FiUser />
                                <span>เข้าสู่ระบบสำหรับผู้ดูแลระบบ</span>
                            </button>

                            {/* Register link */}
                            <Link to="/register" className="register-link">
                                <span>ยังไม่มีบัญชี? สมัครสมาชิก</span>
                            </Link>
                        </div>
                    ) : (
                        /* Admin Login Form */
                        <div className="admin-login-section">
                            <form onSubmit={handleAdminLogin} className="admin-login-form">
                                <div className="form-group">
                                    <label htmlFor="username">
                                        <FiUser />
                                        <span>ชื่อผู้ใช้</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        className="input"
                                        placeholder="admin"
                                        value={adminCredentials.username}
                                        onChange={(e) => setAdminCredentials(prev => ({
                                            ...prev,
                                            username: e.target.value
                                        }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">
                                        <FiLock />
                                        <span>รหัสผ่าน</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        className="input"
                                        placeholder="••••••••"
                                        value={adminCredentials.password}
                                        onChange={(e) => setAdminCredentials(prev => ({
                                            ...prev,
                                            password: e.target.value
                                        }))}
                                        required
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    className="btn btn-primary admin-submit-btn"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                                </motion.button>
                            </form>

                            <button
                                className="back-to-user-login"
                                onClick={() => {
                                    setShowAdminLogin(false);
                                    setLoginError('');
                                }}
                            >
                                <FiArrowLeft />
                                <span>กลับไปหน้า Login หลัก</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
