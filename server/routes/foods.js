const express = require('express');

module.exports = (db, foods) => {
    const router = express.Router();

    // Get all foods with optional filters
    router.get('/', (req, res) => {
        try {
            let result = [...foods];
            const { category, minPrice, maxPrice, search, tags } = req.query;

            // Filter by category
            if (category && category !== 'all') {
                const categories = category.split(',');
                result = result.filter(f => categories.includes(f.category));
            }

            // Filter by price range
            if (minPrice) {
                result = result.filter(f => f.price >= parseInt(minPrice));
            }
            if (maxPrice) {
                result = result.filter(f => f.price <= parseInt(maxPrice));
            }

            // Filter by search term
            if (search) {
                const searchLower = search.toLowerCase();
                result = result.filter(f =>
                    f.name.toLowerCase().includes(searchLower) ||
                    f.nameEn.toLowerCase().includes(searchLower) ||
                    f.description.toLowerCase().includes(searchLower)
                );
            }

            // Filter by tags
            if (tags) {
                const tagList = tags.split(',');
                result = result.filter(f =>
                    tagList.some(tag => f.tags.includes(tag))
                );
            }

            // Sorting
            const sort = req.query.sort || 'name';
            result.sort((a, b) => {
                switch (sort) {
                    case 'price-low':
                        return a.price - b.price;
                    case 'price-high':
                        return b.price - a.price;
                    case 'rating':
                        return b.rating - a.rating;
                    case 'name':
                    default:
                        return a.name.localeCompare(b.name, 'th');
                }
            });

            // Pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            const total = result.length;
            const totalPages = Math.ceil(total / limit);
            const paginatedResults = result.slice(startIndex, endIndex);

            res.json({
                success: true,
                count: paginatedResults.length,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                },
                data: paginatedResults
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get single food by ID
    router.get('/:id', (req, res) => {
        try {
            const food = foods.find(f => f.id === parseInt(req.params.id));
            if (!food) {
                return res.status(404).json({ success: false, error: 'Food not found' });
            }
            res.json({ success: true, data: food });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get random food
    router.get('/action/random', (req, res) => {
        try {
            let pool = [...foods];
            const { category, minPrice, maxPrice, exclude, userId } = req.query;

            // Exclude foods disliked today by this user
            if (userId) {
                const today = new Date().toISOString().split('T')[0];
                const dislikes = db.prepare(`
                    SELECT food_id FROM food_feedback 
                    WHERE user_id = ? AND action = 'dislike' 
                    AND date(created_at) = ?
                `).all(userId, today);

                const dislikedIds = dislikes.map(d => d.food_id);
                pool = pool.filter(f => !dislikedIds.includes(f.id));
            }

            // Apply filters
            if (category && category !== 'all') {
                const categories = category.split(',');
                pool = pool.filter(f => categories.includes(f.category));
            }
            if (minPrice) {
                pool = pool.filter(f => f.price >= parseInt(minPrice));
            }
            if (maxPrice) {
                pool = pool.filter(f => f.price <= parseInt(maxPrice));
            }
            if (exclude) {
                const excludeIds = exclude.split(',').map(id => parseInt(id));
                pool = pool.filter(f => !excludeIds.includes(f.id));
            }

            if (pool.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'ไม่พบเมนูที่ตรงกับเงื่อนไข (หรือคุณอาจกดไม่ชอบจนหมดแล้ว)'
                });
            }

            const randomFood = pool[Math.floor(Math.random() * pool.length)];
            res.json({ success: true, data: randomFood });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Save feedback
    router.post('/:id/feedback', (req, res) => {
        try {
            const { userId, action } = req.body;
            const foodId = parseInt(req.params.id);

            if (!['like', 'dislike'].includes(action)) {
                return res.status(400).json({ success: false, error: 'Invalid action' });
            }

            const stmt = db.prepare('INSERT INTO food_feedback (user_id, food_id, action) VALUES (?, ?, ?)');
            stmt.run(userId || 'anonymous', foodId, action);

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get daily stats for a food
    router.get('/:id/stats', (req, res) => {
        try {
            const foodId = parseInt(req.params.id);
            const today = new Date().toISOString().split('T')[0];

            const stats = db.prepare(`
                SELECT 
                    SUM(CASE WHEN action = 'like' THEN 1 ELSE 0 END) as likes,
                    SUM(CASE WHEN action = 'dislike' THEN 1 ELSE 0 END) as dislikes
                FROM food_feedback
                WHERE food_id = ? AND date(created_at) = ?
            `).get(foodId, today);

            res.json({
                success: true,
                data: {
                    likes: stats.likes || 0,
                    dislikes: stats.dislikes || 0
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all categories
    router.get('/meta/categories', (req, res) => {
        try {
            const categories = [...new Set(foods.map(f => ({
                id: f.category,
                name: f.categoryName
            })))];

            // Remove duplicates by id
            const uniqueCategories = Array.from(
                new Map(categories.map(c => [c.id, c])).values()
            );

            res.json({ success: true, data: uniqueCategories });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get price ranges
    router.get('/meta/price-ranges', (req, res) => {
        try {
            const prices = foods.map(f => f.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);

            const ranges = [
                { id: 'cheap', name: 'ราคาถูก', label: '< 50 บาท', min: 0, max: 50 },
                { id: 'medium', name: 'ราคากลาง', label: '50-150 บาท', min: 50, max: 150 },
                { id: 'expensive', name: 'ราคาสูง', label: '> 150 บาท', min: 150, max: 9999 }
            ];

            res.json({
                success: true,
                data: ranges,
                stats: { min, max }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
