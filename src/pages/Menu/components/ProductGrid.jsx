import React from 'react';
import { Plus, Pizza, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductGrid = ({
    items = [],
    cart = {},
    userId,
    selectedCategory,
    searchTerm,
    onItemClick,
    onUpdateCart,
    onOpenPizzaBuilder
}) => {
    const showPizzaBuilder = Boolean(
        !searchTerm &&
        selectedCategory &&
        selectedCategory.toLowerCase().includes('pizza')
    );

    const sectionTitle = searchTerm ? 'Resultados' : selectedCategory;

    return (
        <section>
            <div className="menu-section-header">
                <h3 className="menu-section-title">{sectionTitle}</h3>
                <span className="menu-split-hint">
                    <Sparkles size={12} color="#f59e0b" />
                    <span>Toque no item p/ ver detalhes</span>
                </span>
            </div>

            <div className="menu-product-grid">
                {showPizzaBuilder && (
                    <div
                        className="menu-pizza-builder-card"
                        onClick={onOpenPizzaBuilder}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="menu-pizza-builder-thumb">
                            <Pizza size={28} />
                        </div>
                        <div className="menu-pizza-builder-info">
                            <h4 className="menu-pizza-builder-title">
                                Montar Pizza Meio a Meio
                            </h4>
                            <p className="menu-pizza-builder-desc">
                                Escolha 2 sabores desta categoria.
                            </p>
                        </div>
                        <div className="menu-add-btn">
                            <Plus size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                )}

                {items.map((item, idx) => {
                    let totalInCart = 0;
                    Object.values(cart).forEach((uCart) => {
                        totalInCart += (uCart[item.id] || 0);
                    });

                    const isFeatured = Boolean(item.is_featured || idx === 1);

                    return (
                        <ProductCard
                            key={item.id}
                            item={item}
                            quantityInCart={totalInCart}
                            isFeatured={isFeatured}
                            onItemClick={onItemClick}
                            onAdd={(prod) => onUpdateCart(userId, prod, 1)}
                            onRemove={(prod) => onUpdateCart(userId, prod, -1)}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default ProductGrid;
