const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (query, foods) => {
    const router = express.Router();

    // Auth middleware
    const requireAdmin = (req, res, next) => {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        next();
    };

    // Admin login
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const result = await query('SELECT * FROM admins WHERE username = $1', [username]);

            if (result.rows.length === 0 || !bcrypt.compareSync(password, result.rows[0].password_hash)) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            const admin = result.rows[0];
            req.session.isAdmin = true;
            req.session.adminId = admin.id;

            res.json({
                success: true,
                message: 'Login successful',
                data: { username: admin.username }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Admin logout
    router.post('/logout', (req, res) => {
        req.session.isAdmin = false;
        req.session.adminId = null;
        res.json({ success: true, message: 'Logged out' });
    });

    // Check auth status
    router.get('/auth', (req, res) => {
        res.json({
            success: true,
            isAuthenticated: !!req.session.isAdmin
        });
    });

    // Get stats
    router.get('/stats', requireAdmin, async (req, res) => {
        try {
            const usersResult = await query('SELECT COUNT(*) as count FROM users');
            const selectionsResult = await query('SELECT COUNT(*) as count FROM user_selections');
            const viewsResult = await query('SELECT COUNT(*) as count FROM page_views');

            res.json({
                success: true,
                data: {
                    totalUsers: parseInt(usersResult.rows[0].count) || 0,
                    totalSelections: parseInt(selectionsResult.rows[0].count) || 0,
                    totalPageViews: parseInt(viewsResult.rows[0].count) || 0,
                    totalMenus: foods.length
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get popular menus
    router.get('/popular-menus', requireAdmin, async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const result = await query(
                `SELECT food_id, COUNT(*) as selection_count 
                 FROM user_selections 
                 GROUP BY food_id 
                 ORDER BY selection_count DESC 
                 LIMIT $1`,
                [limit]
            );

            const popularMenus = result.rows.map(row => {
                const food = foods.find(f => f.id === row.food_id);
                return {
                    ...food,
                    selectionCount: parseInt(row.selection_count)
                };
            }).filter(Boolean);

            res.json({ success: true, data: popularMenus });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get category stats
    router.get('/category-stats', requireAdmin, (req, res) => {
        const categoryStats = {};
        foods.forEach(food => {
            const cat = food.categoryName || food.category || 'Other';
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        });

        const data = Object.entries(categoryStats).map(([name, count]) => ({ name, count }));
        res.json({ success: true, data });
    });

    // Get users list
    router.get('/users', requireAdmin, async (req, res) => {
        try {
            const result = await query(
                'SELECT id, email, name, role, created_at, last_visit FROM users ORDER BY created_at DESC LIMIT 50'
            );
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get daily stats
    router.get('/daily-stats', requireAdmin, async (req, res) => {
        try {
            const result = await query(
                `SELECT DATE(selected_at) as date, COUNT(*) as count 
                 FROM user_selections 
                 WHERE selected_at >= NOW() - INTERVAL '7 days' 
                 GROUP BY DATE(selected_at) 
                 ORDER BY date`
            );
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ========================================
    // Menu Management
    // ========================================

    // Get all menus
    router.get('/menus', requireAdmin, (req, res) => {
        res.json({ success: true, data: foods });
    });

    // Add new menu
    router.post('/menus', requireAdmin, (req, res) => {
        try {
            const newId = Math.max(...foods.map(f => f.id), 0) + 1;
            const newFood = {
                id: newId,
                name: req.body.name,
                nameEn: req.body.nameEn || '',
                description: req.body.description || '',
                price: req.body.price || 0,
                category: req.body.category || 'thai',
                categoryName: req.body.categoryName || 'อาหารไทย',
                image: req.body.image || '',
                tags: req.body.tags || [],
                rating: req.body.rating || 4.5
            };
            foods.push(newFood);
            res.json({ success: true, data: newFood });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Update menu
    router.put('/menus/:id', requireAdmin, (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const index = foods.findIndex(f => f.id === id);
            if (index === -1) {
                return res.status(404).json({ success: false, error: 'Menu not found' });
            }
            foods[index] = { ...foods[index], ...req.body, id };
            res.json({ success: true, data: foods[index] });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete menu
    router.delete('/menus/:id', requireAdmin, (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const index = foods.findIndex(f => f.id === id);
            if (index === -1) {
                return res.status(404).json({ success: false, error: 'Menu not found' });
            }
            foods.splice(index, 1);
            res.json({ success: true, message: 'Menu deleted' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
