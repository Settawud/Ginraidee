const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (db, foods) => {
    const router = express.Router();

    // Auth middleware
    const requireAdmin = (req, res, next) => {
        if (!req.session.isAdmin) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        next();
    };

    // Admin login
    router.post('/login', (req, res) => {
        try {
            const { username, password } = req.body;

            const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

            if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

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

    // Get dashboard stats
    router.get('/stats', requireAdmin, (req, res) => {
        try {
            // Total users
            const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

            // Users today
            const usersToday = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) = DATE('now')
      `).get().count;

            // Total selections
            const totalSelections = db.prepare('SELECT COUNT(*) as count FROM user_selections').get().count;

            // Selections today
            const selectionsToday = db.prepare(`
        SELECT COUNT(*) as count FROM user_selections 
        WHERE DATE(selected_at) = DATE('now')
      `).get().count;

            // Page views today
            const pageViewsToday = db.prepare(`
        SELECT COUNT(*) as count FROM page_views 
        WHERE DATE(viewed_at) = DATE('now')
      `).get().count;

            // Users by day (last 7 days)
            const usersByDay = db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM users 
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `).all();

            // Selections by day (last 7 days)
            const selectionsByDay = db.prepare(`
        SELECT DATE(selected_at) as date, COUNT(*) as count 
        FROM user_selections 
        WHERE selected_at >= DATE('now', '-7 days')
        GROUP BY DATE(selected_at)
        ORDER BY date DESC
      `).all();

            res.json({
                success: true,
                data: {
                    totalUsers,
                    usersToday,
                    totalSelections,
                    selectionsToday,
                    pageViewsToday,
                    usersByDay,
                    selectionsByDay
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get popular menus
    router.get('/popular-menus', requireAdmin, (req, res) => {
        try {
            const { limit = 10, days = 30 } = req.query;

            const popularMenus = db.prepare(`
        SELECT food_id, COUNT(*) as selection_count 
        FROM user_selections 
        WHERE selected_at >= DATE('now', '-' || ? || ' days')
        GROUP BY food_id 
        ORDER BY selection_count DESC 
        LIMIT ?
      `).all(parseInt(days), parseInt(limit));

            // Enrich with food details
            const enrichedMenus = popularMenus.map(item => {
                const food = foods.find(f => f.id === item.food_id);
                return {
                    ...item,
                    food: food || { id: item.food_id, name: 'Unknown' }
                };
            });

            res.json({ success: true, data: enrichedMenus });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get category stats
    router.get('/category-stats', requireAdmin, (req, res) => {
        try {
            const selections = db.prepare(`
        SELECT food_id, COUNT(*) as count FROM user_selections GROUP BY food_id
      `).all();

            const categoryStats = {};
            selections.forEach(sel => {
                const food = foods.find(f => f.id === sel.food_id);
                if (food) {
                    if (!categoryStats[food.category]) {
                        categoryStats[food.category] = {
                            category: food.category,
                            categoryName: food.categoryName,
                            count: 0
                        };
                    }
                    categoryStats[food.category].count += sel.count;
                }
            });

            res.json({
                success: true,
                data: Object.values(categoryStats).sort((a, b) => b.count - a.count)
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get recent users
    router.get('/recent-users', requireAdmin, (req, res) => {
        try {
            const { limit = 20 } = req.query;

            const recentUsers = db.prepare(`
        SELECT id, preferences, created_at, last_visit 
        FROM users 
        ORDER BY last_visit DESC 
        LIMIT ?
      `).all(parseInt(limit));

            res.json({ success: true, data: recentUsers });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ========================================
    // MENU MANAGEMENT CRUD
    // ========================================

    // Get all menus for admin
    router.get('/menus', requireAdmin, (req, res) => {
        try {
            res.json({ success: true, data: foods });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Add new menu item
    router.post('/menus', requireAdmin, (req, res) => {
        try {
            const newFood = req.body;

            // Generate new ID
            const maxId = Math.max(...foods.map(f => f.id), 0);
            newFood.id = maxId + 1;

            // Add to array (in production, save to file/database)
            foods.push(newFood);

            res.json({
                success: true,
                message: 'Menu added successfully',
                data: newFood
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Update menu item
    router.put('/menus/:id', requireAdmin, (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const updates = req.body;

            const index = foods.findIndex(f => f.id === id);
            if (index === -1) {
                return res.status(404).json({ success: false, error: 'Menu not found' });
            }

            // Update the food item
            foods[index] = { ...foods[index], ...updates, id };

            res.json({
                success: true,
                message: 'Menu updated successfully',
                data: foods[index]
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete menu item
    router.delete('/menus/:id', requireAdmin, (req, res) => {
        try {
            const id = parseInt(req.params.id);

            const index = foods.findIndex(f => f.id === id);
            if (index === -1) {
                return res.status(404).json({ success: false, error: 'Menu not found' });
            }

            // Remove from array
            const deleted = foods.splice(index, 1)[0];

            res.json({
                success: true,
                message: 'Menu deleted successfully',
                data: deleted
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ========================================
    // USER MANAGEMENT
    // ========================================

    // Get all users with pagination
    router.get('/users', requireAdmin, (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const users = db.prepare(`
                SELECT id, preferences, created_at, last_visit 
                FROM users 
                ORDER BY last_visit DESC 
                LIMIT ? OFFSET ?
            `).all(parseInt(limit), offset);

            const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

            res.json({
                success: true,
                data: users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get specific user details
    router.get('/users/:id', requireAdmin, (req, res) => {
        try {
            const { id } = req.params;

            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const selections = db.prepare(`
                SELECT food_id, selected_at 
                FROM user_selections 
                WHERE user_id = ? 
                ORDER BY selected_at DESC 
                LIMIT 50
            `).all(id);

            // Enrich selections with food data
            const enrichedSelections = selections.map(s => ({
                ...s,
                food: foods.find(f => f.id === s.food_id) || { id: s.food_id, name: 'Unknown' }
            }));

            res.json({
                success: true,
                data: {
                    ...user,
                    preferences: JSON.parse(user.preferences || '{}'),
                    selections: enrichedSelections
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete user
    router.delete('/users/:id', requireAdmin, (req, res) => {
        try {
            const { id } = req.params;

            // Delete user selections first
            db.prepare('DELETE FROM user_selections WHERE user_id = ?').run(id);

            // Delete user
            const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

            if (result.changes === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
