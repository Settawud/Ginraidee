import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiTag } from 'react-icons/fi';
import './Modal.css';

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.9, y: 20 }
};

export function Modal({ isOpen, onClose, children }) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        className="modal-content"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close" onClick={onClose}>
                            <FiX />
                        </button>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Food Quick View Modal Content
export function FoodQuickView({ food, onClose }) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
        if (imagePath.startsWith('http')) return imagePath;
        return `${apiBase}${imagePath}`;
    };

    return (
        <div className="food-quickview">
            <div className="quickview-image-container">
                <img
                    src={getImageUrl(food.image)}
                    alt={food.name}
                    className="quickview-image"
                />
                <div className="quickview-rating">
                    <FiStar /> {food.rating?.toFixed(1) || '4.5'}
                </div>
            </div>

            <div className="quickview-info">
                <div className="quickview-header">
                    <h2 className="quickview-name">{food.name}</h2>
                    <span className="quickview-name-en">{food.nameEn}</span>
                </div>

                <p className="quickview-description">{food.description}</p>

                <div className="quickview-meta">
                    <span className="quickview-category">
                        {food.categoryName || food.category}
                    </span>
                    {food.tags && food.tags.length > 0 && (
                        <div className="quickview-tags">
                            <FiTag />
                            {food.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="quickview-tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="quickview-footer">
                    <span className="quickview-price">฿{food.price}</span>
                    <button className="btn btn-primary" onClick={onClose}>
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;
