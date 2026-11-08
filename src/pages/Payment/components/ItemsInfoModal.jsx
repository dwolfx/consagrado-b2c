import React from 'react';

const ItemsInfoModal = ({ myOrders = [], subtotal = 0, onClose }) => {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Seu Consumo"
            style={bottomSheetOverlayStyle}
            onClick={onClose}
        >
            <div
                style={{ ...bottomSheetStyle, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={handleStyle} />
                <h3 style={{ marginBottom: '1rem', flexShrink: 0 }}>Seu Consumo</h3>
                <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1rem' }}>
                    {myOrders.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Nenhum item encontrado.</p>
                    ) : (
                        myOrders.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px dashed var(--bg-tertiary)'
                                }}
                            >
                                <div>
                                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{item.quantity}x</span>
                                    <span>{item.name}</span>
                                </div>
                                <span>{((Number(item.price) || 0) * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        ))
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '1rem 0',
                    fontWeight: 'bold',
                    borderTop: '2px solid var(--bg-tertiary)',
                    flexShrink: 0
                }}>
                    <span>Total Itens</span>
                    <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <button type="button" onClick={onClose} className="btn btn-primary" style={{ marginTop: '0.5rem', flexShrink: 0 }}>
                    Fechar
                </button>
            </div>
        </div>
    );
};

const bottomSheetOverlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'center',
    zIndex: 110,
    padding: 0
};

const bottomSheetStyle = {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'var(--bg-secondary)',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '2rem',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative'
};

const handleStyle = {
    width: '40px',
    height: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '2px',
    margin: '0 auto 1.5rem auto',
    flexShrink: 0
};

export default ItemsInfoModal;
