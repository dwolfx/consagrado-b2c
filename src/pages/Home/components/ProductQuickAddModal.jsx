import { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ProductQuickAddModal = ({ product, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);

    if (!product) return null;

    const totalPrice = (Number(product.price) || 0) * quantity;

    const handleConfirm = () => {
        onAddToCart?.(product, quantity);
        onClose?.();
    };

    return (
        <div
            className="home-quick-modal-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Adicionar ${product.name} ao carrinho`}
        >
            <div className="home-quick-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="home-quick-modal-close"
                    onClick={onClose}
                    aria-label="Fechar detalhes do produto"
                >
                    <X size={16} />
                </button>

                <div className="home-quick-modal-header">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="home-quick-modal-thumb"
                    />

                    <div className="home-quick-modal-info">
                        <h3 className="home-quick-modal-title">{product.name}</h3>
                        <p className="home-quick-modal-desc">
                            {product.description || product.category || 'Especialidade preparada na hora'}
                        </p>
                        <span className="home-quick-modal-unit-price">
                            {formatCurrency(product.price)}
                        </span>
                    </div>
                </div>

                <div className="home-quick-modal-controls">
                    <div className="home-qty-selector" aria-label="Quantidade">
                        <button
                            type="button"
                            className="home-qty-btn"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Diminuir quantidade"
                        >
                            −
                        </button>
                        <span className="home-qty-value">{quantity}</span>
                        <button
                            type="button"
                            className="home-qty-btn"
                            onClick={() => setQuantity((q) => q + 1)}
                            aria-label="Aumentar quantidade"
                        >
                            +
                        </button>
                    </div>

                    <button
                        type="button"
                        className="home-btn-add-cart"
                        onClick={handleConfirm}
                    >
                        <span className="home-btn-add-cart-label">
                            <ShoppingBag size={17} />
                            <span>Adicionar</span>
                        </span>
                        <span>{formatCurrency(totalPrice)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductQuickAddModal;
