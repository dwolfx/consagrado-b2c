import React from 'react';
import { CheckCircle } from 'lucide-react';

const ReceiptModal = ({ selectedOrder, onClose }) => {
    if (!selectedOrder) return null;

    const getItemPrice = (i) => {
        if (i.is_split && i.split_parts > 1 && i.original_price > 0) {
            return Number(i.original_price) / i.split_parts;
        }
        return Number(i.price);
    };

    const subtotal = selectedOrder.items.reduce((acc, i) => acc + (getItemPrice(i) * i.quantity), 0);
    const serviceFees = subtotal * 0.04;
    const totalPaid = subtotal * 1.04 + 1.99;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Recibo de Pagamento"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    width: '100%',
                    maxWidth: '480px',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    padding: '2rem',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    position: 'relative',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', margin: '0 auto 2rem auto' }} />

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: 'var(--success)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <CheckCircle size={32} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pagamento Confirmado</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.date} • {selectedOrder.place}</p>
                </div>

                <div style={{ borderTop: '1px dashed var(--bg-tertiary)', borderBottom: '1px dashed var(--bg-tertiary)', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
                    {selectedOrder.items.map((item, idx) => {
                        const realPrice = getItemPrice(item);
                        return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.name}</span>
                                <span>{(realPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        );
                    })}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Taxa do App</span>
                        <span>R$ 1,99</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Taxas de Serviço e Maquininha</span>
                        <span>{serviceFees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Total Pago</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
                        {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>

                <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
                    Fechar Recibo
                </button>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ReceiptModal;
