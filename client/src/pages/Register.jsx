import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiArrowLeft } from 'react-icons/fi';
import { api } from '../hooks/useFood';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.email || !formData.password) {
            setError('กรุณากรอก Email และรหัสผ่าน');
            return;
        }

        if (formData.password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                name: formData.name || formData.email.split('@')[0]
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <p className="login-subtitle">สร้างบัญชีใหม่</p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            className="login-success"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            ✅ ลงทะเบียนสำเร็จ! กำลังพาไปหน้า Login...
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            className="login-error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit} className="admin-login-form">
                            <div className="form-group">
                                <label htmlFor="name">
                                    <FiUser />
                                    <span>ชื่อ (ไม่บังคับ)</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="input"
                                    placeholder="ชื่อของคุณ"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">
                                    <FiMail />
                                    <span>Email *</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="input"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">
                                    <FiLock />
                                    <span>รหัสผ่าน *</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="input"
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">
                                    <FiLock />
                                    <span>ยืนยันรหัสผ่าน *</span>
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="input"
                                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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
                                {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                            </motion.button>
                        </form>
                    )}

                    <div className="login-divider">
                        <span>หรือ</span>
                    </div>

                    <Link to="/login" className="continue-guest">
                        <FiArrowLeft />
                        <span>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</span>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
