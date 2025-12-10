const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
    const router = express.Router();

    // Get or create user
    router.post('/init', (req, res) => {
        try {
            let userId = req.session.userId;

            if (!userId) {
                userId = uuidv4();
                req.session.userId = userId;

                // Create new user
                db.prepare(`
          INSERT INTO users (id, session_id, preferences) 
          VALUES (?, ?, '{}')
        `).run(userId, req.sessionID);
            } else {
                // Update last visit
                db.prepare(`
          UPDATE users SET last_visit = CURRENT_TIMESTAMP WHERE id = ?
        `).run(userId);
            }

            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

            res.json({
                success: true,
                data: {
                    id: user.id,
                    preferences: JSON.parse(user.preferences || '{}'),
                    isNewUser: !user.last_visit
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Track food selection
    router.post('/select', (req, res) => {
        try {
            const userId = req.session.userId;
            const { foodId } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'User not initialized' });
            }

            db.prepare(`
        INSERT INTO user_selections (user_id, food_id) VALUES (?, ?)
      `).run(userId, foodId);

            res.json({ success: true, message: 'Selection tracked' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Update preferences
    router.post('/preferences', (req, res) => {
        try {
            const userId = req.session.userId;
            const { preferences } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'User not initialized' });
            }

            db.prepare(`
        UPDATE users SET preferences = ? WHERE id = ?
      `).run(JSON.stringify(preferences), userId);

            res.json({ success: true, message: 'Preferences updated' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get user history
    router.get('/history', (req, res) => {
        try {
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'User not initialized' });
            }

            const history = db.prepare(`
        SELECT food_id, selected_at 
        FROM user_selections 
        WHERE user_id = ? 
        ORDER BY selected_at DESC 
        LIMIT 50
      `).all(userId);

            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Track page view
    router.post('/pageview', (req, res) => {
        try {
            const userId = req.session.userId || 'anonymous';
            const { page } = req.body;

            db.prepare(`
        INSERT INTO page_views (user_id, page) VALUES (?, ?)
      `).run(userId, page);

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
