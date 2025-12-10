const express = require('express');
const passport = require('passport');

module.exports = (db) => {
    const router = express.Router();

    // ========================================
    // Google OAuth Routes
    // ========================================

    // Start Google OAuth flow
    router.get('/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    // Google OAuth callback
    router.get('/google/callback',
        passport.authenticate('google', {
            failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`
        }),
        (req, res) => {
            // Successful authentication
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/callback`);
        }
    );

    // ========================================
    // Auth Status & User Info
    // ========================================

    // Get current user info
    router.get('/me', (req, res) => {
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
        } else if (req.session.isAdmin) {
            // Admin session from existing login
            res.json({
                success: true,
                isAuthenticated: true,
                user: {
                    id: req.session.adminId,
                    name: 'Admin',
                    role: 'admin'
                }
            });
        } else if (req.session.userId) {
            // User session from email/password login
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
            if (user) {
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
                res.json({
                    success: true,
                    isAuthenticated: false,
                    user: null
                });
            }
        } else {
            res.json({
                success: true,
                isAuthenticated: false,
                user: null
            });
        }
    });

    // Logout
    router.post('/logout', (req, res) => {
        // Clear Google OAuth session
        if (req.logout) {
            req.logout((err) => {
                if (err) {
                    console.error('Logout error:', err);
                }
            });
        }

        // Clear admin session
        req.session.isAdmin = false;
        req.session.adminId = null;

        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // ========================================
    // User Management (for OAuth users)
    // ========================================

    // Get user by Google ID (internal use)
    const findOrCreateUser = (profile) => {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || '';
        const name = profile.displayName || '';
        const picture = profile.photos?.[0]?.value || '';

        // Check if user exists
        let user = db.prepare('SELECT * FROM google_users WHERE google_id = ?').get(googleId);

        if (!user) {
            // Create new user
            const result = db.prepare(`
                INSERT INTO google_users (google_id, email, name, picture, role)
                VALUES (?, ?, ?, ?, 'user')
            `).run(googleId, email, name, picture);

            user = {
                id: result.lastInsertRowid,
                google_id: googleId,
                email,
                name,
                picture,
                role: 'user'
            };
        } else {
            // Update user info
            db.prepare(`
                UPDATE google_users 
                SET name = ?, picture = ?, last_login = CURRENT_TIMESTAMP
                WHERE google_id = ?
            `).run(name, picture, googleId);
        }

        return user;
    };

    // Expose for passport strategy
    router.findOrCreateUser = findOrCreateUser;

    // ========================================
    // Email/Password Registration & Login
    // ========================================
    const bcrypt = require('bcryptjs');

    // Register with email/password
    router.post('/register', async (req, res) => {
        try {
            const { email, password, name } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'กรุณากรอก email และ password'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                });
            }

            // Check if email already exists
            const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email นี้ถูกใช้งานแล้ว'
                });
            }

            // Hash password
            const passwordHash = bcrypt.hashSync(password, 10);

            // Create user
            const result = db.prepare(`
                INSERT INTO users (id, email, password_hash, name, role, created_at, last_visit)
                VALUES (?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).run(
                require('uuid').v4(),
                email,
                passwordHash,
                name || email.split('@')[0]
            );

            res.json({
                success: true,
                message: 'ลงทะเบียนสำเร็จ!'
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Login with email/password
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'กรุณากรอก email และ password'
                });
            }

            // Find user
            const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

            if (!user || !user.password_hash) {
                return res.status(401).json({
                    success: false,
                    error: 'Email หรือรหัสผ่านไม่ถูกต้อง'
                });
            }

            // Check password
            if (!bcrypt.compareSync(password, user.password_hash)) {
                return res.status(401).json({
                    success: false,
                    error: 'Email หรือรหัสผ่านไม่ถูกต้อง'
                });
            }

            // Update last visit
            db.prepare('UPDATE users SET last_visit = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

            // Set session
            req.session.userId = user.id;
            req.session.userRole = user.role;

            res.json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ!',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
