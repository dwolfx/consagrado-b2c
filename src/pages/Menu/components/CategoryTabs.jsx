import React from 'react';
import {
    ShoppingBag,
    Beer,
    Wine,
    UtensilsCrossed,
    Coffee,
    Pizza,
    IceCream,
    Sandwich
} from 'lucide-react';

const CATEGORY_ICONS = {
    'Cervejas': Beer,
    'Chopps': Beer,
    'Drinks': Wine,
    'Petiscos': UtensilsCrossed,
    'Porções': UtensilsCrossed,
    'Pizzas': Pizza,
    'Lanches': Sandwich,
    'Sem Álcool': Coffee,
    'Sobremesas': IceCream,
    'Pratos': UtensilsCrossed
};

const CategoryTabs = ({ categories = [], selectedCategory, onSelectCategory }) => {
    return (
        <div className="menu-categories-row" role="tablist" aria-label="Categorias do cardápio">
            {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || ShoppingBag;
                const isSelected = selectedCategory === cat;
                const tabClass = isSelected
                    ? 'menu-category-tab menu-category-tab--active'
                    : 'menu-category-tab';

                return (
                    <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => onSelectCategory(cat)}
                        className={tabClass}
                    >
                        <div className="menu-category-squircle">
                            <div className="menu-category-icon-ring">
                                <Icon size={16} />
                            </div>
                        </div>
                        <span className="menu-category-label">{cat}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryTabs;
