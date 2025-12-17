const express = require('express');

module.exports = (query, foods) => {
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

    // Get food by ID
    router.get('/:id', (req, res) => {
        const food = foods.find(f => f.id === parseInt(req.params.id));
        if (food) {
            res.json({ success: true, data: food });
        } else {
            res.status(404).json({ success: false, error: 'Food not found' });
        }
    });

    // Get random food (Client calls /action/random)
    router.get('/action/random', (req, res) => {
        try {
            let pool = [...foods];
            const { category, minPrice, maxPrice, exclude } = req.query;

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
                    error: 'No food matches your criteria'
                });
            }

            const randomFood = pool[Math.floor(Math.random() * pool.length)];
            res.json({ success: true, data: randomFood });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get categories (Client calls /meta/categories)
    router.get('/meta/categories', (req, res) => {
        try {
            const categories = [...new Set(foods.map(f => ({
                id: f.category,
                name: f.categoryName || (f.category === 'thai' ? 'อาหารไทย' :
                    f.category === 'japanese' ? 'อาหารญี่ปุ่น' :
                        f.category === 'korean' ? 'อาหารเกาหลี' :
                            f.category === 'western' ? 'อาหารตะวันตก' :
                                f.category === 'fastfood' ? 'ฟาสต์ฟู้ด' :
                                    f.category === 'dessert' ? 'ของหวาน' : f.category)
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

    // Get foods by category
    router.get('/category/:category', (req, res) => {
        const categoryFoods = foods.filter(f => f.category === req.params.category);
        res.json({ success: true, data: categoryFoods });
    });

    // Save user selection
    router.post('/select', async (req, res) => {
        try {
            const { userId, foodId } = req.body;
            if (userId && foodId) {
                await query(
                    'INSERT INTO user_selections (user_id, food_id) VALUES ($1, $2)',
                    [userId, foodId]
                );
            }
            res.json({ success: true });
        } catch (error) {
            console.error('Selection error:', error);
            res.json({ success: true }); // Don't fail on tracking errors
        }
    });

    // Save user feedback (like/dislike)
    router.post('/feedback', async (req, res) => {
        try {
            const { userId, foodId, feedback } = req.body;

            // Create feedback table if not exists
            await query(`
                CREATE TABLE IF NOT EXISTS food_feedback (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT,
                    food_id INTEGER NOT NULL,
                    feedback TEXT NOT NULL CHECK (feedback IN ('like', 'dislike')),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            await query(
                'INSERT INTO food_feedback (user_id, food_id, feedback) VALUES ($1, $2, $3)',
                [userId || null, foodId, feedback]
            );

            res.json({ success: true, message: 'Feedback saved' });
        } catch (error) {
            console.error('Feedback error:', error);
            res.json({ success: true }); // Don't fail on tracking errors
        }
    });

    return router;
};
