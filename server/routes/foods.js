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

            res.json({
                success: true,
                count: result.length,
                data: result
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
