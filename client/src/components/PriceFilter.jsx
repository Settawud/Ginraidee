import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign } from 'react-icons/fi';
import './PriceFilter.css';

const PriceFilter = ({ selected, onSelect }) => {
    const priceRanges = [
        { id: 'all', name: 'ทุกราคา', min: 0, max: 9999, level: 0 },
        { id: 'cheap', name: 'ราคาถูก', label: '< ฿50', min: 0, max: 50, level: 1 },
        { id: 'medium', name: 'ราคากลาง', label: '฿50-150', min: 50, max: 150, level: 2 },
        { id: 'expensive', name: 'ราคาสูง', label: '> ฿150', min: 150, max: 9999, level: 3 }
    ];

    return (
        <div className="price-filter">
            <h4 className="price-filter-title">
                <FiDollarSign />
                ช่วงราคา
            </h4>
            <div className="price-options">
                {priceRanges.map((range, index) => (
                    <motion.button
                        key={range.id}
                        className={`price-option ${selected === range.id ? 'active' : ''}`}
                        onClick={() => onSelect(range)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <span className="price-option-level">
                            {range.level === 0 ? (
                                '∞'
                            ) : (
                                [...Array(range.level)].map((_, i) => (
                                    <FiDollarSign key={i} className="dollar-icon" />
                                ))
                            )}
                        </span>
                        <span className="price-option-name">{range.name}</span>
                        {range.label && (
                            <span className="price-option-label">{range.label}</span>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default PriceFilter;
