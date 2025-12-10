import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft, FiLogIn } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAdmin, loginWithGoogle, loginWithEmail, loading } = useAuth();

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                        <p className="login-subtitle">เข้าสู่ระบบเพื่อใช้งาน</p>
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

                    {/* Email/Password Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">
                                <FiMail />
                                <span>Email</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input"
                                placeholder="your@email.com"
                                value={credentials.email}
                                onChange={handleChange}
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
                                name="password"
                                className="input"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <motion.button
                            type="submit"
                            className="btn btn-primary login-submit-btn"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FiLogIn />
                            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </motion.button>
                    </form>

                    <div className="login-divider">
                        <span>หรือ</span>
                    </div>

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

                    <div className="login-footer">
                        {/* Continue without login */}
                        <Link to="/" className="continue-guest">
                            <FiArrowLeft />
                            <span>ใช้งานโดยไม่ต้องเข้าสู่ระบบ</span>
                        </Link>

                        {/* Register link */}
                        <Link to="/register" className="register-link">
                            <span>ยังไม่มีบัญชี? สมัครสมาชิก</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
