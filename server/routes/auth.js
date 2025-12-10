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

    return router;
};
