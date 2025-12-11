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
