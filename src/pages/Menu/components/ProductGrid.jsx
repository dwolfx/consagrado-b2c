import React from 'react';
import { Plus } from 'lucide-react';

const ProductGrid = ({
    items,
    cart,
    userId,
    selectedCategory,
    searchTerm,
    onItemClick,
    onUpdateCart,
    onOpenPizzaBuilder
}) => {

    // Check if category is pizza-related for the Builder Card
    const showPizzaBuilder = !searchTerm && selectedCategory && selectedCategory.toLowerCase().includes('pizza');

    return (
        <div>
            <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                {searchTerm ? `Resultados` : selectedCategory}
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Contextual "Meio a Meio" Button */}
                {showPizzaBuilder && (
                    <div
                        className="card"
                        onClick={onOpenPizzaBuilder}
                        style={{
                            display: 'flex', flexDirection: 'row', alignItems: 'center',
                            marginBottom: 0, cursor: 'pointer', gap: '1rem',
                            border: '2px dashed var(--brand-color)',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)'
                        }}
                    >
                        <div style={{
                            width: '80px', height: '80px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--brand-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '2rem', flexShrink: 0
                        }}>
                            🍕
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--brand-color)' }}>
                                Montar Pizza Meio a Meio
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Escolha 2 sabores desta categoria.
                            </p>
                        </div>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                            <Plus size={20} />
                        </div>
                    </div>
                )}

                {items.map(item => {
                    // Calculate total in cart for this item (across everyone in current local cart, usually just user)
                    // The cart prop passed here should be the ALL users cart or just current user?
                    // Expected: cart is object { userId: { productId: qty } }
                    let totalInCart = 0;
                    Object.values(cart).forEach(uCart => totalInCart += (uCart[item.id] || 0));

                    return (
                        <div
                            key={item.id}
                            className="card"
                            onClick={() => onItemClick(item)}
                            style={{
                                display: 'flex', flexDirection: 'row', alignItems: 'center', // Enforcing Row
                                marginBottom: 0, cursor: 'pointer', gap: '1rem',
                                textAlign: 'left' // Enforcing Left Align
                            }}
                        >
                            {(item.image_url || item.image) && (
                                <div style={{ flexShrink: 0 }}>
                                    <img
                                        src={item.image_url || item.image}
                                        alt={item.name}
                                        style={{
                                            width: '80px', height: '80px',
                                            borderRadius: '12px', objectFit: 'cover',
                                            backgroundColor: 'var(--bg-tertiary)'
                                        }}
                                        onError={(e) => e.target.style.display = 'none'} // Fallback if broken
                                    />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                                {item.description && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {item.description}
                                    </p>
                                )}
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>

                            {totalInCart === 0 ? (
                                <button
                                    className="btn btn-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateCart(userId, item, 1);
                                    }}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                                >
                                    +
                                </button>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '20px', padding: '4px' }}>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateCart(userId, item, -1);
                                        }}
                                        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                                    >
                                        -
                                    </button>
                                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{totalInCart}</span>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateCart(userId, item, 1);
                                        }}
                                        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductGrid;
