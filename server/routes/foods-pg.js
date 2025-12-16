const express = require('express');

module.exports = (query, foods) => {
    const router = express.Router();

    // Get all foods
    router.get('/', (req, res) => {
        res.json({
            success: true,
            data: foods
        });
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
        // Filter logic can be added here if needed, or just random
        const randomFood = foods[Math.floor(Math.random() * foods.length)];
        res.json({ success: true, data: randomFood });
    });

    // Get categories (Client calls /meta/categories)
    router.get('/meta/categories', (req, res) => {
        // Extract unique categories from foods
        const categories = [...new Set(foods.map(f => f.category))].map(cat => ({
            id: cat,
            name: cat === 'thai' ? 'อาหารไทย' :
                cat === 'japanese' ? 'อาหารญี่ปุ่น' :
                    cat === 'korean' ? 'อาหารเกาหลี' :
                        cat === 'western' ? 'อาหารตะวันตก' :
                            cat === 'fastfood' ? 'ฟาสต์ฟู้ด' :
                                cat === 'dessert' ? 'ของหวาน' : cat
        }));
        res.json({ success: true, data: categories });
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
