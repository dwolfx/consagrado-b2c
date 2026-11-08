import { useState } from 'react';
import {
    X,
    Sparkles,
    ShoppingBag,
    Users,
    Beer,
    Wine,
    Pizza,
    Sandwich,
    Coffee,
    IceCream,
    UtensilsCrossed
} from 'lucide-react';
import './ProductDetailModal.css';

const resolveHeroIcon = (category = '') => {
    const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key.includes('cervej') || key.includes('chopp')) return Beer;
    if (key.includes('drink') || key.includes('vinho') || key.includes('dose')) return Wine;
    if (key.includes('pizza')) return Pizza;
    if (key.includes('lanch') || key.includes('burger') || key.includes('hamburg')) return Sandwich;
    if (key.includes('alcool') || key.includes('suco') || key.includes('refrig')) return Coffee;
    if (key.includes('sobremesa') || key.includes('doce')) return IceCream;
    return UtensilsCrossed;
};

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ProductDetailModal = ({ product, onClose, onAddToCart, onSplit }) => {
    const [quantity, setQuantity] = useState(1);
    const [imgError, setImgError] = useState(false);

    if (!product) return null;

    const totalPrice = (Number(product.price) || 0) * quantity;
    const isOutOfStock = Boolean(product.is_out_of_stock);
    const imageUrl = !imgError ? (product.image_url || product.image) : null;
    const FallbackIcon = resolveHeroIcon(product.category);

    const handleConfirm = () => {
        if (isOutOfStock) return;
        onAddToCart?.(product, quantity);
        onClose?.();
    };

    return (
        <div
            className="product-detail-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${product.name}`}
        >
            <div className="product-detail-sheet" onClick={(e) => e.stopPropagation()}>
                {/* Hero Top Grandona com botão fechar */}
                <div className="product-detail-hero-wrap">
                    <button
                        type="button"
                        className="product-detail-close-btn"
                        onClick={onClose}
                        aria-label="Fechar detalhes do produto"
                    >
                        <X size={18} />
                    </button>

                    {imageUrl ? (
                        <>
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="product-detail-hero-img"
                                onError={() => setImgError(true)}
                            />
                            <div className="product-detail-hero-gradient" />
                        </>
                    ) : (
                        <div className="product-detail-hero-fallback">
                            <FallbackIcon size={56} strokeWidth={1.75} />
                            <span className="product-detail-hero-badge">
                                {product.category || 'Consagrado Especial'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Corpo do Item */}
                <div className="product-detail-body">
                    {product.is_featured && (
                        <span className="product-detail-featured-tag">
                            <Sparkles size={12} />
                            <span>Quem conhece, pede</span>
                        </span>
                    )}

                    <h3 className="product-detail-title">{product.name}</h3>

                    <p className="product-detail-description">
                        {product.description ||
                            'Especialidade da casa servida no capricho e na temperatura perfeita.'}
                    </p>

                    <div className="product-detail-meta-row">
                        <span className="product-detail-price">
                            {formatCurrency(product.price)}
                        </span>
                        {product.category && (
                            <span className="product-detail-category-badge">
                                {product.category}
                            </span>
                        )}
                    </div>

                    {/* Ações: Stepper + Botões Adicionar / Dividir */}
                    {!isOutOfStock ? (
                        <div className="product-detail-actions-group">
                            <div className="product-detail-actions">
                                <div className="product-detail-stepper" aria-label="Seletor de Quantidade">
                                    <button
                                        type="button"
                                        className="product-detail-stepper-btn"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        aria-label="Diminuir quantidade"
                                    >
                                        −
                                    </button>
                                    <span className="product-detail-stepper-val">{quantity}</span>
                                    <button
                                        type="button"
                                        className="product-detail-stepper-btn"
                                        onClick={() => setQuantity((q) => q + 1)}
                                        aria-label="Aumentar quantidade"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="product-detail-confirm-btn"
                                    onClick={handleConfirm}
                                    aria-label={`Adicionar ${quantity} ${product.name} ao carrinho`}
                                >
                                    <span className="product-detail-confirm-label">
                                        <ShoppingBag size={18} />
                                        <span>Adicionar</span>
                                    </span>
                                    <span className="product-detail-confirm-total">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </button>
                            </div>

                            {onSplit && (
                                <button
                                    type="button"
                                    className="product-detail-split-btn"
                                    onClick={() => {
                                        onSplit(product, quantity);
                                        onClose?.();
                                    }}
                                    aria-label="Dividir este item com a mesa"
                                >
                                    <Users size={18} />
                                    <span>Dividir com a mesa</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="product-detail-out-stock-box">
                            Item temporariamente indisponível no bar
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
