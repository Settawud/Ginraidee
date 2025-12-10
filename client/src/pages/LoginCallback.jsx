import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * LoginCallback - Handle OAuth callback
 * หน้านี้จะถูกเรียกหลังจาก Google OAuth callback สำเร็จ
 */
const LoginCallback = () => {
    const navigate = useNavigate();
    const { checkAuth, loading } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            // Re-check auth to get user data from session
            await checkAuth();

            // Redirect to home after successful login
            navigate('/', { replace: true });
        };

        handleCallback();
    }, [checkAuth, navigate]);

    return (
        <div className="login-page">
            <div className="login-loading">
                <div className="spinner" />
                <p>กำลังเข้าสู่ระบบ...</p>
            </div>
        </div>
    );
};

export default LoginCallback;
