import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configure axios
const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true
});

// Foods Hook
export function useFoods(initialFilters = {}) {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);

    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

    const fetchFoods = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filters.category && filters.category !== 'all') {
                const categoryParam = Array.isArray(filters.category)
                    ? filters.category.join(',')
                    : filters.category;
                params.append('category', categoryParam);
            }
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.search) params.append('search', filters.search);
            if (filters.sort) params.append('sort', filters.sort);

            // Pagination params
            params.append('page', filters.page || 1);
            params.append('limit', filters.limit || 12);

            const response = await api.get(`/foods?${params.toString()}`);
            setFoods(response.data.data);

            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }

            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchFoods();
    }, [fetchFoods]);

    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    return { foods, loading, error, filters, updateFilters, refetch: fetchFoods, pagination };
}

// Random Food Hook
export function useRandomFood() {
    const [food, setFood] = useState(null);
    const [loading, setLoading] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [history, setHistory] = useState([]);

    const getRandomFood = async (options = {}) => {
        try {
            setSpinning(true);
            setLoading(true);

            // Simulate slot machine effect
            const spinDuration = 2000;
            const intervalDuration = 100;
            const iterations = spinDuration / intervalDuration;

            // Get all foods for animation
            const allFoodsRes = await api.get('/foods');
            const allFoods = allFoodsRes.data.data;

            // Animate through random foods
            for (let i = 0; i < iterations; i++) {
                const randomIndex = Math.floor(Math.random() * allFoods.length);
                setFood(allFoods[randomIndex]);
                await new Promise(r => setTimeout(r, intervalDuration + (i * 5)));
            }

            // Get actual random food with filters
            const params = new URLSearchParams();
            if (options.category && options.category !== 'all') {
                const categoryParam = Array.isArray(options.category)
                    ? options.category.join(',')
                    : options.category;
                params.append('category', categoryParam);
            }
            if (options.minPrice) params.append('minPrice', options.minPrice);
            if (options.maxPrice) params.append('maxPrice', options.maxPrice);
            if (options.userId) params.append('userId', options.userId);

            // Exclude recently viewed foods to prevent duplicates
            if (history.length > 0) {
                const excludeIds = history.map(f => f.id).join(',');
                params.append('exclude', excludeIds);
            }

            const response = await api.get(`/foods/action/random?${params.toString()}`);
            const finalFood = response.data.data;

            setFood(finalFood);
            setHistory(prev => {
                // Keep only last 10 items to prevent URL becoming too long
                const newHistory = [finalFood, ...prev];
                return newHistory.slice(0, 10);
            });

            // Track selection
            try {
                await api.post('/users/select', { foodId: finalFood.id });
            } catch {
                console.log('Tracking failed, continuing...');
            }

        } catch (err) {
            console.error('Random food error:', err);
            // Handle specific case where all foods are disliked
            if (err.response && err.response.status === 404) {
                setFood(null);
                alert(err.response.data.error || 'ไม่พบเมนู');
            }
        } finally {
            setLoading(false);
            setSpinning(false);
        }
    };

    const sendFeedback = async (foodId, action, userId) => {
        try {
            await api.post(`/foods/${foodId}/feedback`, { action, userId });
        } catch (err) {
            console.error('Feedback error:', err);
        }
    };

    const getStats = async (foodId) => {
        try {
            const response = await api.get(`/foods/${foodId}/stats`);
            return response.data.data;
        } catch (err) {
            console.error('Stats error:', err);
            return { likes: 0, dislikes: 0 };
        }
    };

    return { food, loading, spinning, history, getRandomFood, setFood, sendFeedback, getStats };
}

// Categories Hook
export function useCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/foods/meta/categories');
                setCategories([
                    { id: 'all', name: 'ทั้งหมด' },
                    ...response.data.data
                ]);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
                // Fallback categories
                setCategories([
                    { id: 'all', name: 'ทั้งหมด' },
                    { id: 'thai', name: 'อาหารไทย' },
                    { id: 'japanese', name: 'อาหารญี่ปุ่น' },
                    { id: 'korean', name: 'อาหารเกาหลี' },
                    { id: 'western', name: 'อาหารตะวันตก' },
                    { id: 'fastfood', name: 'ฟาสต์ฟู้ด' },
                    { id: 'dessert', name: 'ของหวาน' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    return { categories, loading };
}

// User Hook
export function useUser() {
    const [user, setUser] = useState(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const initUser = async () => {
            try {
                const response = await api.post('/users/init');
                setUser(response.data.data);
            } catch (err) {
                console.error('User init failed:', err);
            } finally {
                setInitialized(true);
            }
        };
        initUser();
    }, []);

    const updatePreferences = async (preferences) => {
        try {
            await api.post('/users/preferences', { preferences });
            setUser(prev => ({ ...prev, preferences }));
        } catch (err) {
            console.error('Failed to update preferences:', err);
        }
    };

    return { user, initialized, updatePreferences };
}

export { api };
