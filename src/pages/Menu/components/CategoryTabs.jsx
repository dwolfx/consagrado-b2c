import React from 'react';
import { ShoppingBag, Beer, Wine, UtensilsCrossed, Coffee, Pizza, IceCream, Sandwich } from 'lucide-react';

const CATEGORY_ICONS = {
    'Cervejas': Beer,
    'Drinks': Wine,
    'Petiscos': Pizza,
    'Lanches': Sandwich,
    'Sem Álcool': Coffee,
    'Sobremesas': IceCream,
    'Pratos': UtensilsCrossed
};

const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
    return (
        <div style={{
            display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem',
            marginBottom: '1rem', scrollbarWidth: 'none'
        }}>
            {categories.map(cat => {
                const Icon = CATEGORY_ICONS[cat] || ShoppingBag;
                const isSelected = selectedCategory === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => onSelectCategory(cat)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            minWidth: '80px', opacity: isSelected ? 1 : 0.6,
                            background: 'none', border: 'none', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '16px', overflow: 'hidden',
                            border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}>
                            <Icon size={24} color={isSelected ? 'var(--primary)' : 'var(--text-secondary)'} />
                        </div>
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: isSelected ? 'white' : 'var(--text-secondary)' }}>
                            {cat}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryTabs;
