import React from 'react';

const CartFooter = ({ count, total, sending, onCheckout }) => {
    if (count === 0) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '1rem', left: '1rem', right: '1rem',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 100 // Ensure above other content
        }}>
            <button
                onClick={onCheckout}
                disabled={sending}
                className="btn btn-primary"
                style={{
                    borderRadius: '16px', padding: '1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 10px 25px -5px var(--primary-glow)',
                    width: '100%'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.2)', width: '28px', height: '28px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 'bold'
                    }}>
                        {count}
                    </div>
                    <span>Fazer pedido</span>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {sending ? 'Enviando...' : total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </button>
        </div>
    );
};

export default CartFooter;
