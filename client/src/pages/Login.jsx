import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAdmin, loginWithGoogle, loginWithEmail, loading } = useAuth();

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('error') ? 'การเข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่อีกครั้ง' : '';
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && !loading) {
            // Redirect admin to admin dashboard, user to home
            if (isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            }
        }
    }, [isAuthenticated, isAdmin, loading, navigate, location]);

    const handleGoogleLogin = () => {
        loginWithGoogle();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        setLoginError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsSubmitting(true);

        const result = await loginWithEmail(credentials.email, credentials.password);

        if (!result.success) {
            setLoginError(result.error);
        }
        // If success, useEffect will handle redirect based on role

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
            {/* Decorative background */}
            <div className="login-background">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
            </div>

            <div className="login-container">
                <motion.div
                    className="login-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="login-header">
                        <motion.div
                            className="login-logo"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                            <span className="logo-emoji">🍜</span>
                        </motion.div>
                        <h1 className="login-title">ยินดีต้อนรับ</h1>
                        <p className="login-subtitle">เข้าสู่ระบบเพื่อใช้งาน Ginraidee</p>
                    </div>

                    {/* Error Message */}
                    {loginError && (
                        <motion.div
                            className="login-error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className="error-icon">⚠️</span>
                            {loginError}
                        </motion.div>
                    )}

                    {/* Google Login Button - Primary CTA */}
                    <motion.button
                        className="google-login-btn"
                        onClick={handleGoogleLogin}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FcGoogle className="google-icon" />
                        <span>เข้าสู่ระบบด้วย Google</span>
                    </motion.button>

                    <div className="login-divider">
                        <span>หรือใช้อีเมล</span>
                    </div>

                    {/* Email/Password Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <div className="input-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    type="text"
                                    id="email"
                                    name="email"
                                    className="input"
                                    placeholder="อีเมล หรือ ชื่อผู้ใช้ (Admin)"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <FiLock className="input-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    className="input"
                                    placeholder="รหัสผ่าน"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            className="login-submit-btn"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FiLogIn />
                            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </motion.button>
                    </form>

                    <div className="login-footer">
                        {/* Register link */}
                        <p className="register-text">
                            ยังไม่มีบัญชี?
                            <Link to="/register" className="register-link">สมัครสมาชิก</Link>
                        </p>

                        {/* Continue without login */}
                        <Link to="/" className="continue-guest">
                            <FiArrowLeft />
                            <span>ใช้งานโดยไม่ต้องเข้าสู่ระบบ</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
