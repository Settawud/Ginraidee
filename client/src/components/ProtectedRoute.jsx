import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute - ป้องกัน routes ที่ต้อง login
 * 
 * @param {ReactNode} children - Component ที่จะแสดง
 * @param {boolean} requireAdmin - ต้องเป็น admin หรือไม่
 * @param {boolean} requireAuth - ต้อง login หรือไม่ (default: true)
 */
function ProtectedRoute({ children, requireAdmin = false, requireAuth = true }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="protected-loading">
                <div className="spinner" />
                <p>กำลังตรวจสอบสิทธิ์...</p>
            </div>
        );
    }

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
        // Redirect to login, save current path for redirect back
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if admin role is required
    if (requireAdmin && !isAdmin) {
        // Redirect to home if not admin
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
