const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = (query) => {
    const router = express.Router();

    // ========================================
    // Google OAuth Routes
    // ========================================

    router.get('/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    router.get('/google/callback',
        passport.authenticate('google', {
            failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`
        }),
        (req, res) => {
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/callback`);
        }
    );

    // ========================================
    // Auth Status & User Info
    // ========================================

    router.get('/me', async (req, res) => {
        try {
            if (req.isAuthenticated && req.isAuthenticated() && req.user) {
                res.json({
                    success: true,
                    isAuthenticated: true,
                    user: {
                        id: req.user.id,
                        email: req.user.email,
                        name: req.user.name,
                        picture: req.user.picture,
                        role: req.user.role
                    }
                });
            } else if (req.session?.isAdmin) {
                res.json({
                    success: true,
                    isAuthenticated: true,
                    user: {
                        id: req.session.adminId,
                        name: 'Admin',
                        role: 'admin'
                    }
                });
            } else if (req.session?.userId) {
                const result = await query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    res.json({
                        success: true,
                        isAuthenticated: true,
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role || 'user'
                        }
                    });
                } else {
                    res.json({ success: true, isAuthenticated: false, user: null });
                }
            } else {
                res.json({ success: true, isAuthenticated: false, user: null });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            res.json({ success: true, isAuthenticated: false, user: null });
        }
    });

    // Logout
    router.post('/logout', (req, res) => {
        if (req.logout) {
            req.logout((err) => {
                if (err) console.error('Logout error:', err);
            });
        }
        req.session.isAdmin = false;
        req.session.adminId = null;
        req.session.userId = null;
        req.session.destroy((err) => {
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // ========================================
    // User Management (for OAuth users)
    // ========================================

    const findOrCreateUser = async (profile) => {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || '';
        const picture = profile.photos?.[0]?.value || '';

        let result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);

        if (result.rows.length === 0) {
            const id = uuidv4();
            await query(
                `INSERT INTO users (id, google_id, email, name, picture, role)
                 VALUES ($1, $2, $3, $4, $5, 'user')`,
                [id, googleId, email, name, picture]
            );
            return { id, google_id: googleId, email, name, picture, role: 'user' };
        } else {
            await query(
                `UPDATE users SET name = $1, picture = $2, last_visit = NOW() WHERE google_id = $3`,
                [name, picture, googleId]
            );
            return result.rows[0];
        }
    };

    router.findOrCreateUser = findOrCreateUser;

    // ========================================
    // Email/Password Registration & Login
    // ========================================

    router.post('/register', async (req, res) => {
        try {
            const { email, password, name } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'กรุณากรอก email และ password' });
            }

            if (password.length < 6) {
                return res.status(400).json({ success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
            }

            const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ success: false, error: 'Email นี้ถูกใช้งานแล้ว' });
            }

            const passwordHash = bcrypt.hashSync(password, 10);
            const id = uuidv4();

            await query(
                `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'user')`,
                [id, email, passwordHash, name || email.split('@')[0]]
            );

            res.json({ success: true, message: 'ลงทะเบียนสำเร็จ!' });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'กรุณากรอก email และ password' });
            }

            // First check users table
            let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

            // If not found, check admins table
            if (userResult.rows.length === 0) {
                const adminResult = await query('SELECT * FROM admins WHERE username = $1', [email]);
                if (adminResult.rows.length > 0) {
                    const admin = adminResult.rows[0];
                    if (bcrypt.compareSync(password, admin.password_hash)) {
                        req.session.isAdmin = true;
                        req.session.adminId = admin.id;
                        return res.json({
                            success: true,
                            message: 'เข้าสู่ระบบสำเร็จ!',
                            user: { id: admin.id, name: admin.username, email: admin.username, role: 'admin' }
                        });
                    }
                }
                return res.status(401).json({ success: false, error: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
            }

            const user = userResult.rows[0];
            if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
                return res.status(401).json({ success: false, error: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
            }

            await query('UPDATE users SET last_visit = NOW() WHERE id = $1', [user.id]);

            if (user.role === 'admin') {
                req.session.isAdmin = true;
                req.session.adminId = user.id;
            } else {
                req.session.userId = user.id;
                req.session.userRole = user.role;
            }

            res.json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ!',
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
