import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiImage } from 'react-icons/fi';
import { api } from '../hooks/useFood';
import './MenuManagement.css';

const CATEGORIES = [
    { value: 'thai', label: 'อาหารไทย' },
    { value: 'japanese', label: 'อาหารญี่ปุ่น' },
    { value: 'korean', label: 'อาหารเกาหลี' },
    { value: 'western', label: 'อาหารตะวันตก' },
    { value: 'fastfood', label: 'ฟาสต์ฟู้ด' },
    { value: 'dessert', label: 'ของหวาน' },
];

const emptyFood = {
    name: '',
    nameEn: '',
    description: '',
    price: 0,
    category: 'thai',
    categoryName: 'อาหารไทย',
    image: '',
    tags: [],
    rating: 4.5
};

const MenuManagement = () => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [formData, setFormData] = useState(emptyFood);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/menus');
            setMenus(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch menus:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingMenu(null);
        setFormData(emptyFood);
        setTagInput('');
        setShowModal(true);
    };

    const handleOpenEdit = (menu) => {
        setEditingMenu(menu);
        setFormData({
            name: menu.name || '',
            nameEn: menu.nameEn || '',
            description: menu.description || '',
            price: menu.price || 0,
            category: menu.category || 'thai',
            categoryName: menu.categoryName || 'อาหารไทย',
            image: menu.image || '',
            tags: menu.tags || [],
            rating: menu.rating || 4.5
        });
        setTagInput((menu.tags || []).join(', '));
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingMenu(null);
        setFormData(emptyFood);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'category') {
            const cat = CATEGORIES.find(c => c.value === value);
            setFormData(prev => ({
                ...prev,
                category: value,
                categoryName: cat?.label || value
            }));
        } else if (name === 'price' || name === 'rating') {
            setFormData(prev => ({
                ...prev,
                [name]: parseFloat(value) || 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleTagInputChange = (e) => {
        setTagInput(e.target.value);
        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, tags }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('กรุณาใส่ชื่อเมนู');
            return;
        }

        try {
            setSaving(true);

            if (editingMenu) {
                // Update existing
                await api.put(`/admin/menus/${editingMenu.id}`, formData);
            } else {
                // Create new
                await api.post('/admin/menus', formData);
            }

            await fetchMenus();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save menu:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/menus/${id}`);
            await fetchMenus();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete menu:', error);
            alert('เกิดข้อผิดพลาดในการลบ');
        }
    };

    if (loading) {
        return (
            <div className="menu-mgmt-loading">
                <div className="spinner" />
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    return (
        <div className="menu-management">
            <div className="menu-mgmt-header">
                <h3>🍽️ จัดการเมนูอาหาร</h3>
                <button className="btn-add" onClick={handleOpenAdd}>
                    <FiPlus /> เพิ่มเมนูใหม่
                </button>
            </div>

            <div className="menu-table-wrapper">
                <table className="menu-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ชื่อเมนู</th>
                            <th>หมวดหมู่</th>
                            <th>ราคา</th>
                            <th>Rating</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menus.map((menu) => (
                            <motion.tr
                                key={menu.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <td>{menu.id}</td>
                                <td>
                                    <div className="menu-name-cell">
                                        <span className="menu-emoji">🍜</span>
                                        <div>
                                            <span className="menu-name">{menu.name}</span>
                                            <span className="menu-name-en">{menu.nameEn}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="category-badge">{menu.categoryName}</span>
                                </td>
                                <td>฿{menu.price}</td>
                                <td>⭐ {menu.rating}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleOpenEdit(menu)}
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => setDeleteConfirm(menu.id)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h4>{editingMenu ? '✏️ แก้ไขเมนู' : '➕ เพิ่มเมนูใหม่'}</h4>
                                <button className="btn-close" onClick={handleCloseModal}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="menu-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>ชื่อเมนู (ไทย) *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="เช่น ผัดกะเพราหมูสับ"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ชื่อเมนู (อังกฤษ)</label>
                                        <input
                                            type="text"
                                            name="nameEn"
                                            value={formData.nameEn}
                                            onChange={handleChange}
                                            placeholder="e.g. Basil Pork"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>รายละเอียด</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="อธิบายเมนูอาหาร..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>หมวดหมู่</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>ราคา (บาท)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Rating</label>
                                        <input
                                            type="number"
                                            name="rating"
                                            value={formData.rating}
                                            onChange={handleChange}
                                            min="0"
                                            max="5"
                                            step="0.1"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>URL รูปภาพ</label>
                                    <div className="image-input">
                                        <FiImage />
                                        <input
                                            type="text"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleChange}
                                            placeholder="/images/menu.jpg"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Tags (คั่นด้วยเครื่องหมายจุลภาค)</label>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={handleTagInputChange}
                                        placeholder="spicy, rice, popular"
                                    />
                                    {formData.tags.length > 0 && (
                                        <div className="tags-preview">
                                            {formData.tags.map((tag, i) => (
                                                <span key={i} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        ยกเลิก
                                    </button>
                                    <button type="submit" className="btn-save" disabled={saving}>
                                        <FiSave />
                                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            className="modal-content delete-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h4>⚠️ ยืนยันการลบ</h4>
                            <p>คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?</p>
                            <div className="delete-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setDeleteConfirm(null)}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    className="btn-confirm-delete"
                                    onClick={() => handleDelete(deleteConfirm)}
                                >
                                    ลบเลย
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MenuManagement;
