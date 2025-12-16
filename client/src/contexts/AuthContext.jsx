import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useFood';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check authentication status
    const checkAuth = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/me');

            if (response.data.isAuthenticated && response.data.user) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
            setError(null);
        } catch (err) {
            console.error('Auth check failed:', err);
            setUser(null);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial auth check
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Login with Google (redirect)
    const loginWithGoogle = () => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        window.location.href = `${apiBase}/auth/google`;
    };

    // Login with username/password (for admin)
    const loginWithCredentials = async (username, password) => {
        try {
            const response = await api.post('/admin/login', { username, password });
            if (response.data.success) {
                await checkAuth();
                return { success: true };
            }
            return { success: false, error: 'Login failed' };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            };
        }
    };

    // Login with email/password (for users)
    const loginWithEmail = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success) {
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: 'Login failed' };
        } catch (err) {
            return {
                success: false,
                error: err.response?.data?.error || 'Email หรือรหัสผ่านไม่ถูกต้อง'
            };
        }
    };

    // Logout
    const logout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
            // Force clear user anyway
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user',
        loginWithGoogle,
        loginWithCredentials,
        loginWithEmail,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// export default AuthContext;
