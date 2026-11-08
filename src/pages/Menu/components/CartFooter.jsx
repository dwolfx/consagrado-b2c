import React from 'react';
import { ChevronRight } from 'lucide-react';

const CartFooter = ({ count, total, sending, onCheckout }) => {
    if (count === 0) return null;

    const formattedTotal = Number(total || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className="menu-cart-dock-wrap">
            <button
                type="button"
                onClick={onCheckout}
                disabled={sending}
                className="menu-cart-dock"
            >
                <div className="menu-cart-left">
                    <div className="menu-cart-count">{count}</div>
                    <span className="menu-cart-label">Fazer pedido</span>
                </div>
                <div className="menu-cart-right">
                    <span className="menu-cart-total">
                        {sending ? 'Enviando...' : formattedTotal}
                    </span>
                    {!sending && <ChevronRight size={18} strokeWidth={2.5} />}
                </div>
            </button>
        </div>
    );
};

export default CartFooter;
