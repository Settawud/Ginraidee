const express = require('express');

module.exports = (query) => {
    const router = express.Router();

    // Track page view
    router.post('/pageview', async (req, res) => {
        try {
            const { userId, page } = req.body;
            await query(
                'INSERT INTO page_views (user_id, page) VALUES ($1, $2)',
                [userId || null, page || 'home']
            );
            res.json({ success: true });
        } catch (error) {
            console.error('Page view error:', error);
            res.json({ success: true });
        }
    });

    // Initialize user (Client calls /users/init)
    router.post('/init', (req, res) => {
        // Return current session user or null
        // If needed, we can create a temporary session here
        if (req.user) {
            res.json({ success: true, data: req.user });
        } else if (req.session?.userId) {
            // Fetch user from DB if needed, or just return basic info
            // For now, let's assume session check handled in auth middleware
            res.json({ success: true, data: { id: req.session.userId } });
        } else {
            // Guest or new user
            res.json({ success: true, data: null });
        }
    });

    // Update preferences (Client calls /users/preferences)
    router.post('/preferences', async (req, res) => {
        try {
            const { preferences } = req.body;
            const userId = req.user?.id || req.session.userId;

            if (userId) {
                await query('UPDATE users SET preferences = $1 WHERE id = $2', [JSON.stringify(preferences), userId]);
                res.json({ success: true });
            } else {
                res.status(401).json({ success: false, error: 'Not authenticated' });
            }
        } catch (error) {
            console.error('Preferences error:', error);
            res.status(500).json({ success: false, error: 'Failed' });
        }
    });

    // Get user history
    router.get('/:userId/history', async (req, res) => {
        try {
            const result = await query(
                `SELECT us.*, us.food_id, us.selected_at 
                 FROM user_selections us 
                 WHERE us.user_id = $1 
                 ORDER BY us.selected_at DESC 
                 LIMIT 20`,
                [req.params.userId]
            );
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('History error:', error);
            res.json({ success: true, data: [] });
        }
    });

    return router;
};
