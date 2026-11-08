import React, { useState } from 'react';
import {
    Plus,
    Minus,
    Sparkles,
    Beer,
    Wine,
    Pizza,
    Sandwich,
    Coffee,
    IceCream,
    UtensilsCrossed
} from 'lucide-react';

const resolveCategoryIcon = (category = '') => {
    const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key.includes('cervej') || key.includes('chopp')) return Beer;
    if (key.includes('drink') || key.includes('vinho') || key.includes('dose')) return Wine;
    if (key.includes('pizza')) return Pizza;
    if (key.includes('lanch') || key.includes('burger') || key.includes('hamburg')) return Sandwich;
    if (key.includes('alcool') || key.includes('suco') || key.includes('refrig')) return Coffee;
    if (key.includes('sobremesa') || key.includes('doce')) return IceCream;
    return UtensilsCrossed;
};

const ProductCard = ({
    item,
    quantityInCart = 0,
    isFeatured = false,
    onItemClick,
    onAdd,
    onRemove
}) => {
    const [imgError, setImgError] = useState(false);
    const isOutOfStock = Boolean(item.is_out_of_stock);
    const imageUrl = !imgError ? (item.image_url || item.image) : null;
    const FallbackIcon = resolveCategoryIcon(item.category);
    const showFeaturedBadge = Boolean(isFeatured || item.is_featured) && !isOutOfStock;

    let cardClass = 'menu-product-card';
    if (isOutOfStock) {
        cardClass += ' menu-product-card--out';
    } else if (quantityInCart > 0) {
        cardClass += ' menu-product-card--active';
    }

    const formattedPrice = Number(item.price || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div
            className={cardClass}
            onClick={() => {
                if (!isOutOfStock && onItemClick) {
                    onItemClick(item);
                }
            }}
        >
            <div className="menu-product-left">
                <div className="menu-product-thumb-wrap">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={item.name}
                            className="menu-product-img"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <FallbackIcon size={24} />
                    )}
                </div>

                <div className="menu-product-meta">
                    {showFeaturedBadge && (
                        <span className="menu-product-featured-tag">
                            <Sparkles size={10} />
                            <span>Quem conhece, pede</span>
                        </span>
                    )}
                    <h4 className="menu-product-title">{item.name}</h4>
                    {item.description && !isOutOfStock && (
                        <p className="menu-product-desc">{item.description}</p>
                    )}
                    <span className="menu-product-price">{formattedPrice}</span>
                </div>
            </div>

            {isOutOfStock ? (
                <span className="menu-out-badge">Em falta</span>
            ) : quantityInCart === 0 ? (
                <button
                    type="button"
                    className="menu-add-btn"
                    aria-label={`Adicionar ${item.name} ao carrinho`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onAdd) onAdd(item);
                    }}
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
            ) : (
                <div
                    className="menu-qty-stepper"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="menu-stepper-btn"
                        aria-label={`Diminuir ${item.name} do carrinho`}
                        onClick={() => onRemove && onRemove(item)}
                    >
                        <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="menu-stepper-value">{quantityInCart}</span>
                    <button
                        type="button"
                        className="menu-stepper-btn menu-stepper-btn--plus"
                        aria-label={`Aumentar ${item.name} no carrinho`}
                        onClick={() => onAdd && onAdd(item)}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductCard;
